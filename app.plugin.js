const {
  withInfoPlist,
  WarningAggregator,
  createRunOncePlugin,
  withProjectBuildGradle,
  withAppBuildGradle,
} = require('@expo/config-plugins');

const pkg = require('./package.json');

const withGoogleServiceInfo = (config) => {
  config = withInfoPlist(config, (config) => {
    const reversedClientId = process.env.EXPO_PUBLIC_REVERSED_CLIENT_ID;
    const clientId = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
    const serverClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!reversedClientId) {
      WarningAggregator.addWarningIOS(
        'google-signin',
        'REVERSED_CLIENT_ID not found in .env.'
      );
      return config;
    }
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    const hasUrlScheme = config.modResults.CFBundleURLTypes.some((urlType) =>
      urlType.CFBundleURLSchemes?.includes(reversedClientId)
    );

    if (!hasUrlScheme) {
      config.modResults.CFBundleURLTypes.push({
        CFBundleURLSchemes: [reversedClientId],
      });
    }

    if (!clientId) {
      WarningAggregator.addWarningIOS(
        'google-signin',
        'IOS_CLIENT_ID not found in .env.'
      );
      return config;
    }

    config.modResults.GIDClientID = clientId;

    if (!serverClientId) {
      WarningAggregator.addWarningIOS(
        'google-signin',
        'GOOGLE_WEB_CLIENT_ID not found in .env.'
      );
      return config;
    }
    config.modResults.GIDServerClientID = serverClientId;
    return config;
  });

  return config;
};

const withGoogleServicesJSON = (config, props = {}) => {
  config = withProjectBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const dependency = `classpath 'com.google.gms:google-services:4.4.1'`;
    if (!buildGradle.includes(dependency)) {
      const newBuildGradle = buildGradle.replace(
        /dependencies\s*\{/,
        `dependencies {\n        ${dependency}`
      );
      config.modResults.contents = newBuildGradle;
    }
    return config;
  });

  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    const plugin = `apply plugin: 'com.google.gms.google-services'`;
    if (!buildGradle.includes(plugin)) {
      config.modResults.contents = `${buildGradle}\n\n${plugin}`;
    }
    return config;
  });
};


const mainPlugin = (config, props) => {
    config = withGoogleServiceInfo(config, props);
    config = withGoogleServicesJSON(config, props);
    return config;
}

module.exports = createRunOncePlugin(mainPlugin, pkg.name, pkg.version); 