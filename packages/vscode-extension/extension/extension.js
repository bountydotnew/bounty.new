"use strict";var h=Object.create;var a=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var w=Object.getOwnPropertyNames;var u=Object.getPrototypeOf,p=Object.prototype.hasOwnProperty;var b=(o,e)=>{for(var t in e)a(o,t,{get:e[t],enumerable:!0})},d=(o,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of w(e))!p.call(o,s)&&s!==t&&a(o,s,{get:()=>e[s],enumerable:!(n=m(e,s))||n.enumerable});return o};var v=(o,e,t)=>(t=o!=null?h(u(o)):{},d(e||!o||!o.__esModule?a(t,"default",{value:o,enumerable:!0}):t,o)),y=o=>d(a({},"__esModule",{value:!0}),o);var f={};b(f,{activate:()=>U,deactivate:()=>W});module.exports=y(f);var r=v(require("vscode"));var i=v(require("vscode")),l=class{constructor(e){this._extensionUri=e}_view;resolveWebviewView(e,t,n){this._view=e,e.webview.options={enableScripts:!0,localResourceRoots:[this._extensionUri]},e.webview.html=this._getHtmlForWebview(e.webview),e.webview.onDidReceiveMessage(async s=>{try{switch(s.type){case"info":{i.window.showInformationMessage(s.value);break}case"error":{i.window.showErrorMessage(s.value);break}default:console.warn("Unknown message type:",s.type)}}catch(c){console.error("Error handling message:",c)}})}revive(e){this._view=e}_getHtmlForWebview(e){let t=e.asWebviewUri(i.Uri.joinPath(this._extensionUri,"media","reset.css")),n=e.asWebviewUri(i.Uri.joinPath(this._extensionUri,"media","vscode.css")),s=e.asWebviewUri(i.Uri.joinPath(this._extensionUri,"media","main.js")),c=g();return`<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${e.cspSource}; script-src 'nonce-${c}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${t}" rel="stylesheet">
				<link href="${n}" rel="stylesheet">
				<title>Bounty</title>
			</head>
			<body>
				<div class="container">
					<h1>Bounty</h1>
					<p>Welcome to Bounty VSCode Extension</p>
					<button id="test-button">Test API Connection</button>
				</div>
				<script nonce="${c}" src="${s}"></script>
			</body>
			</html>`}};function g(){let o="",e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let t=0;t<32;t++)o+=e.charAt(Math.floor(Math.random()*e.length));return o}function U(o){console.log("Bounty extension is now active!");let e=new l(o.extensionUri);console.log("SidebarProvider registered."),o.subscriptions.push(r.window.registerWebviewViewProvider("bounty.sidebarView",e));let t=r.commands.registerCommand("bounty-vscode.helloWorld",()=>{console.log("Hello World command executed."),r.window.showInformationMessage("Hello World from Bounty!")});o.subscriptions.push(t)}function W(){console.log("Bounty extension is now deactivated.")}0&&(module.exports={activate,deactivate});
