// first, remove configuration entry in case service is already configured
ServiceConfiguration.configurations.remove({
  service: "facebook"
});
ServiceConfiguration.configurations.insert({
  service: "facebook",
  appId: "<APPID>",
  secret: "<APPSECRET>"
});