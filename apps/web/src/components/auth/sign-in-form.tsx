"use client";

import {
	useEmailPasswordForm,
	EmailField,
	PasswordField,
	SubmitButton,
} from "./shared";

interface SignInFormProps {
	callbackUrl?: string;
	isAddingAccount?: boolean;
	/**
	 * Whether to show the header with title and description
	 */
	showHeader?: boolean;
}

/**
 * SignInForm
 *
 * Explicit variant component for sign in functionality.
 * Replaces the `mode="signin"` boolean prop pattern.
 *
 * @example
 * ```tsx
 * <SignInForm callbackUrl="/dashboard" />
 * ```
 */
export function SignInForm({
	callbackUrl,
	isAddingAccount = false,
	showHeader = true,
}: SignInFormProps) {
	const { email, setEmail, password, setPassword, isPending, handleSignIn } =
		useEmailPasswordForm(callbackUrl);

	return (
		<div className="w-full max-w-md space-y-6">
			{showHeader && !isAddingAccount && (
				<div className="space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Welcome back
					</h1>
					<p className="text-gray-400 text-sm">
						Enter your email below to sign in to your account
					</p>
				</div>
			)}

			<form
				onSubmit={(e) => handleSignIn(e, isAddingAccount)}
				className="space-y-4"
			>
				<EmailField value={email} onChange={setEmail} disabled={isPending} />

				<PasswordField
					value={password}
					onChange={setPassword}
					disabled={isPending}
					showForgotPassword={!isAddingAccount}
				/>

				<SubmitButton isPending={isPending}>
					{isPending ? "Signing in..." : "Sign in"}
				</SubmitButton>
			</form>
		</div>
	);
}
