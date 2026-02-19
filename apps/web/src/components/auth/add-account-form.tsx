"use client";

import {
	useEmailPasswordForm,
	EmailField,
	PasswordField,
	SubmitButton,
} from "./shared";

/**
 * AddAccountForm
 *
 * Explicit variant component for adding an additional account.
 * Replaces the `isAddingAccount` boolean prop pattern.
 *
 * @example
 * ```tsx
 * <AddAccountForm />
 * ```
 */
export function AddAccountForm() {
	const { email, setEmail, password, setPassword, isPending, handleSignIn } =
		useEmailPasswordForm();

	return (
		<div className="w-full max-w-md space-y-6">
			<form onSubmit={(e) => handleSignIn(e, true)} className="space-y-4">
				<EmailField value={email} onChange={setEmail} disabled={isPending} />

				<PasswordField
					value={password}
					onChange={setPassword}
					disabled={isPending}
					showForgotPassword={false}
				/>

				<SubmitButton isPending={isPending}>
					{isPending ? "Adding account..." : "Add account"}
				</SubmitButton>
			</form>
		</div>
	);
}
