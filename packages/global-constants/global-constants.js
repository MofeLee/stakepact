// Write your package code here!
Schema = {};

if(Meteor.isServer){
  Future = Npm.require('fibers/future');

  sprintf = Npm.require("sprintf-js").sprintf;
  vsprintf = Npm.require("sprintf-js").vsprintf;

  // send email via nodemailer
  nodemailer = Npm.require('nodemailer');

  wepay = Npm.require('wepay').WEPAY;
}