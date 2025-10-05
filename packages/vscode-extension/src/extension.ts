import * as vscode from 'vscode';
import { SidebarProvider } from './providers/SidebarProvider';
import { EXTENSION_CONFIG } from './constants';

export function activate(context: vscode.ExtensionContext): void {
	console.log('[Extension] Bounty extension activated');

	const sidebarProvider = new SidebarProvider(context.extensionUri, context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			EXTENSION_CONFIG.sidebarViewId,
			sidebarProvider
		)
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(EXTENSION_CONFIG.loginCommandId, () => {
			vscode.commands.executeCommand('workbench.view.extension.bounty-sidebar');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(EXTENSION_CONFIG.logoutCommandId, () => {
			sidebarProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand(EXTENSION_CONFIG.refreshCommandId, () => {
			sidebarProvider.refresh();
		})
	);

	console.log('[Extension] Bounty extension ready');
}

export function deactivate(): void {
	console.log('[Extension] Bounty extension deactivated');
}