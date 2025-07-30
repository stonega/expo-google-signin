    package expo.modules.claygooglesignin

    import android.app.Activity
    import android.content.Intent
    import android.os.Bundle
    import com.google.android.gms.auth.api.signin.GoogleSignIn
    import com.google.android.gms.auth.api.signin.GoogleSignInAccount
    import com.google.android.gms.auth.api.signin.GoogleSignInClient
    import com.google.android.gms.auth.api.signin.GoogleSignInOptions
    import com.google.android.gms.common.GoogleApiAvailability
    import com.google.android.gms.common.api.ApiException
    import com.google.android.gms.tasks.Task
    import expo.modules.kotlin.Promise
    import expo.modules.kotlin.exception.CodedException
    import expo.modules.kotlin.modules.Module
    import expo.modules.kotlin.modules.ModuleDefinition

    @Suppress("DEPRECATION")
    class ClayGoogleSigninModule : Module() {
        private var googleSignInClient: GoogleSignInClient? = null
        private var signInPromise: Promise? = null

        private val activity: Activity
            get() = appContext.activityProvider?.currentActivity
                ?: throw CodedException("Activity is not available")

        override fun definition() = ModuleDefinition {
            Name("ClayGoogleSignin")

            OnActivityResult { _, (requestCode, _, data) ->
                if (requestCode == RC_SIGN_IN) {
                    val task = GoogleSignIn.getSignedInAccountFromIntent(data)
                    handleSignInResult(task)
                }
            }

            AsyncFunction("hasPlayServices") { params: Map<String, Any?>, promise: Promise ->
                val showPlayServicesUpdateDialog = params["showPlayServicesUpdateDialog"] as? Boolean ?: true

                val googleApiAvailability = GoogleApiAvailability.getInstance()
                val status = googleApiAvailability.isGooglePlayServicesAvailable(activity)
                if (status == com.google.android.gms.common.ConnectionResult.SUCCESS) {
                    promise.resolve(true)
                } else {
                    if (showPlayServicesUpdateDialog && googleApiAvailability.isUserResolvableError(status)) {
                        googleApiAvailability.getErrorDialog(activity, status, PLAY_SERVICES_RESOLUTION_REQUEST)?.show()
                    }
                    promise.resolve(false)
                }
            }

            AsyncFunction("configure") { params: Map<String, Any?>, promise: Promise ->
                val webClientId = params["webClientId"] as? String
                val scopes = params["scopes"] as? List<String> ?: emptyList()

                val gsoBuilder = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestEmail()

                if (webClientId != null) {
                    gsoBuilder.requestIdToken(webClientId)
                }

                scopes.forEach { scope ->
                    gsoBuilder.requestScopes(com.google.android.gms.common.api.Scope(scope))
                }

                googleSignInClient = GoogleSignIn.getClient(activity, gsoBuilder.build())
                promise.resolve(null)
            }

            AsyncFunction("signIn") { promise: Promise ->
                if (signInPromise != null) {
                    promise.reject(CodedException("A sign-in process is already in progress."))
                    return@AsyncFunction
                }

                val client = googleSignInClient ?: run {
                    promise.reject(CodedException("Google Sign-In has not been configured yet."))
                    return@AsyncFunction
                }
                signInPromise = promise
                val signInIntent: Intent = client.signInIntent
                activity.startActivityForResult(signInIntent, RC_SIGN_IN)
            }

            AsyncFunction("signInSilently") { promise: Promise ->
                val client = googleSignInClient ?: GoogleSignIn.getClient(
                    activity,
                    GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN).requestEmail().build()
                )
                client.silentSignIn().addOnCompleteListener { task ->
                    handleSignInResult(task, promise)
                }
            }

            AsyncFunction("signOut") { promise: Promise ->
                googleSignInClient?.signOut()?.addOnCompleteListener {
                    promise.resolve(null)
                } ?: promise.resolve(null)
            }

            AsyncFunction("revokeAccess") { promise: Promise ->
                googleSignInClient?.revokeAccess()?.addOnCompleteListener {
                    promise.resolve(null)
                } ?: promise.resolve(null)
            }

            AsyncFunction("hasPreviousSignIn") { promise: Promise ->
                promise.resolve(GoogleSignIn.getLastSignedInAccount(activity) != null)
            }

            AsyncFunction("getCurrentUser") { promise: Promise ->
                val account = GoogleSignIn.getLastSignedInAccount(activity)
                promise.resolve(account?.toBundle())
            }
            
            AsyncFunction("addScopes") { scopes: List<String>, promise: Promise ->
                val account = GoogleSignIn.getLastSignedInAccount(activity)
                if (account == null) {
                    promise.reject(CodedException("No user is signed in to add scopes to."))
                    return@AsyncFunction
                }
                val gmsScopes = scopes.map { com.google.android.gms.common.api.Scope(it) }.toTypedArray()
                
                if (!GoogleSignIn.hasPermissions(account, *gmsScopes)) {
                     GoogleSignIn.requestPermissions(activity, RC_ADD_SCOPES, account, *gmsScopes)
                     // This doesn't return a result, so we have to resolve optimistically.
                     promise.resolve(account.toBundle())
                } else {
                     promise.resolve(account.toBundle())
                }
            }

            AsyncFunction("getTokens") { promise: Promise ->
                val account = GoogleSignIn.getLastSignedInAccount(activity)
                if (account == null) {
                    promise.reject(CodedException("No user is currently signed in."))
                    return@AsyncFunction
                }
                promise.resolve(Bundle().apply {
                    putString("idToken", account.idToken)
                    putString("accessToken", account.serverAuthCode)
                })
            }
            
            AsyncFunction("clearCachedAccessToken") { token: String, promise: Promise ->
                // This is deprecated and might not work as expected.
                // It's also not a direct equivalent of what the iOS SDK does (which is nothing).
                com.google.android.gms.auth.GoogleAuthUtil.clearToken(activity, token)
                promise.resolve(null)
            }
        }

        private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>, promise: Promise? = null) {
            val p = promise ?: signInPromise
            if (p == null) {
              return
            }
          
            try {
                val account = completedTask.getResult(ApiException::class.java)
                p.resolve(account.toBundle())
            } catch (e: ApiException) {
                p.reject(CodedException(e.statusCode.toString(), e.message, e))
            } finally {
                if (promise == null) {
                    signInPromise = null
                }
            }
        }

        private fun GoogleSignInAccount.toBundle(): Bundle {
            return Bundle().apply {
                putString("id", id)
                putString("name", displayName)
                putString("email", email)
                putString("photo", photoUrl?.toString())
                putString("familyName", familyName)
                putString("givenName", givenName)
                putString("idToken", idToken)
                putString("serverAuthCode", serverAuthCode)
            }
        }
        
        companion object {
            private const val RC_SIGN_IN = 9001
            private const val RC_ADD_SCOPES = 9002
            private const val PLAY_SERVICES_RESOLUTION_REQUEST = 9000
        }
    }