import ExpoModulesCore
import GoogleSignIn

func getTopViewController() -> UIViewController? {
    let keyWindow = UIApplication.shared.connectedScenes
        .filter({$0.activationState == .foregroundActive})
        .map({$0 as? UIWindowScene})
        .compactMap({$0})
        .first?.windows
        .filter({$0.isKeyWindow}).first
    var topController = keyWindow?.rootViewController
    while let presentedViewController = topController?.presentedViewController {
        topController = presentedViewController
    }
    return topController
}

func convertGIDGoogleUserToDict(user: GIDGoogleUser, serverAuthCode: String? = nil) -> [String: Any?] {
    let profile = user.profile
    
    return [
        "id": user.userID,
        "name": profile?.name,
        "email": profile?.email,
        "photo": profile?.imageURL(withDimension: 320)?.absoluteString,
        "familyName": profile?.familyName,
        "givenName": profile?.givenName,
        "idToken": user.idToken?.tokenString,
        "serverAuthCode": serverAuthCode,
    ]
}

public class ClayGoogleSigninModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ClayGoogleSignin")

    AsyncFunction("configure") { (params: [String: Any], promise: Promise) in
        guard let iosClientId = params["iosClientId"] as? String else {
            promise.reject("MISSING_PARAMS", "iosClientId is required for configuration.")
            return
        }
        
        var serverClientId: String?
        if let id = params["webClientId"] as? String {
            serverClientId = id
        }
        
        let config = GIDConfiguration(clientID: iosClientId, serverClientID: serverClientId)
        GIDSignIn.sharedInstance.configuration = config
        promise.resolve(nil)
    }

    AsyncFunction("signIn") { (promise: Promise) in
        guard let topViewController = getTopViewController() else {
            promise.reject("NO_VIEW_CONTROLLER", "Could not find a top view controller to present the sign in screen.")
            return
        }
        
        GIDSignIn.sharedInstance.signIn(withPresenting: topViewController) { signInResult, error in
            if let error = error {
                promise.reject(String(error._code), error.localizedDescription)
                return
            }
            guard let result = signInResult else {
                promise.reject("SIGN_IN_ERROR", "SignInResult object is nil after sign in.")
                return
            }
            promise.resolve(convertGIDGoogleUserToDict(user: result.user, serverAuthCode: result.serverAuthCode))
        }
    }

    AsyncFunction("signInSilently") { (promise: Promise) in
        GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
            if let error = error {
                promise.reject(String(error._code), error.localizedDescription)
                return
            }
            guard let user = user else {
                promise.resolve(nil)
                return
            }
            promise.resolve(convertGIDGoogleUserToDict(user: user))
        }
    }

    AsyncFunction("signOut") { (promise: Promise) in
        GIDSignIn.sharedInstance.signOut()
        promise.resolve(nil)
    }

    AsyncFunction("revokeAccess") { (promise: Promise) in
        GIDSignIn.sharedInstance.disconnect { error in
            if let error = error {
                promise.reject(String(error._code), error.localizedDescription)
                return
            }
            promise.resolve(nil)
        }
    }
    
    AsyncFunction("hasPreviousSignIn") { (promise: Promise) in
        promise.resolve(GIDSignIn.sharedInstance.hasPreviousSignIn())
    }

    AsyncFunction("getCurrentUser") { (promise: Promise) in
        if let user = GIDSignIn.sharedInstance.currentUser {
            promise.resolve(convertGIDGoogleUserToDict(user: user))
        } else {
            promise.resolve(nil)
        }
    }

    AsyncFunction("addScopes") { (scopes: [String], promise: Promise) in
        guard let topViewController = getTopViewController() else {
            promise.reject("NO_VIEW_CONTROLLER", "Could not find a top view controller to present the screen.")
            return
        }
        guard let user = GIDSignIn.sharedInstance.currentUser else {
            promise.reject("NO_USER", "No user is signed in to add scopes to.")
            return
        }
        user.addScopes(scopes, presenting: topViewController) { signInResult, error in
            if let error = error {
                promise.reject(String(error._code), error.localizedDescription)
                return
            }
            guard let result = signInResult else {
                promise.reject("ADD_SCOPES_ERROR", "SignInResult object is nil after adding scopes.")
                return
            }
            promise.resolve(convertGIDGoogleUserToDict(user: result.user))
        }
    }

    AsyncFunction("getTokens") { (promise: Promise) in
        if let user = GIDSignIn.sharedInstance.currentUser {
            user.refreshTokensIfNeeded { refreshedUser, error in
                if let error = error {
                    promise.reject(String(error._code), error.localizedDescription)
                    return
                }
                if let refreshedUser = refreshedUser {
                    promise.resolve([
                        "idToken": refreshedUser.idToken?.tokenString,
                        "accessToken": refreshedUser.accessToken.tokenString,
                    ])
                } else {
                    promise.reject("GET_TOKENS_ERROR", "Authentication object is nil.")
                }
            }
        } else {
            promise.reject("NO_USER", "No user is signed in.")
        }
    }
    
    AsyncFunction("clearCachedAccessToken") { (promise: Promise) in
      promise.resolve(nil)
    }
  }
}
