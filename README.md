# VS Code - Gitlab MR

VS Code extension for working with Gitlab Merge Requests, supporting both Gitlab.com and Gitlab EE/CE servers.

## Features

* Supports both Gitlab.com and Gitlab CE/EE servers.
* Configurable default remote (e.g. `origin`) and branch (e.g. `master`).

### Create MR

Create an MR from VS Code by providing a branch name and commit message.

**Workflow**

1. Open the command palette and select "Gitlab MR: Create MR".
2. First, input the name of the branch you want created for this MR. If you are not on your default branch, the current branch name will be autofilled (providing a different branch name will result in a new branch).
3. Next, provide the commit message for the changes. If the branch is clean, the last commit message will be autofilled (providing a different commit message will only impact the MR).
4. If the new branch is different from your current branch, the new branch will be created and checked out.
5. If the current branch has uncommitted changes, all changed files will be committed with the provided commit message.
6. The branch will be pushed to the remote specified as `gitlab-mr.targetRemote` (defaults to `origin`).
7. An MR will be created to the branch specified as `gitlab-mr.targetBranch` (defaults to `master`) from the new branch.
8. A message will be shown in VS Code with a link to the MR.

### Checkout MR

Checkout out an existing MR from the current repo.

**Workflow**

1. Open the command palette and select "Gitlab MR: Checkout MR".
2. Select an MR from the list.
3. If the branch for the selected MR does not exist on your computer, it will be created and switched to.
4. If the branch for the selected MR does exist on your computer, it will be switched to.

### View MR

View an existing MR in your browser.

**Workflow**

1. Open the command palette and select "Gitlab MR: View MR".
2. Select an MR from the list.
3. The MR will be opened in your browser.

## Extension Settings

* `gitlab-mr.accessToken`: Access token to use to connect to the Gitlab.com API. Create one by going to Profile Settings -> Access Tokens.
* `gitlab-mr.accessTokens`: Access token to use to connect to Gitlab CE/EE APIs. Create one by going to Profile Settings -> Access Tokens.
* `gitlab-mr.targetBranch`: Default target branch for MRs (defaults to `master`).
* `gitlab-mr.targetRemote`: Default target remote for MRs (defaults to `origin`).
* `gitlab-mr.autoOpenMr`: Automatically open a new MR in your browser.

## Known Issues

[View on Gitlab](https://gitlab.com/jasonnutter/vscode-gitlab-mr/issues?scope=all&state=opened&utf8=%E2%9C%93&label_name%5B%5D=Bug)

## Release Notes

### 1.1.0

* Added: New workflow to checkout an existing MR on your computer.
* Added: New workflow to open an existing MR in your browser.
* Updated: Changed the command palette label of "Open MR" to "Create MR" to reduce confusion with "View MR".
* Added: `gitlab-mr.autoOpenMr` to automatically open a new MR in your browser.

### 1.0.0

* Added: Support for opening MRs from any branch. If you are on a branch other than `master` (or your default), the branch input prompt will be autofilled with that branch name. Changing the name will create a new branch.
* Added: Support for opening MRs from a clean branch. If you are on a clean branch, the commit message input prompt will be autofilled with the last commit message. Changing the message will only impact the MR.
* Breaking: `gitlab-mr.gitlabUrl` has been removed, and `gitlab-mr.accessToken` is now for Gitlab.com access tokens.
* Added: `gitlab-mr.accessTokens` to specify access tokens for Gitlab CE/EE servers. Example:

```json
"gitlab-mr.accessToken": "ACCESS_TOKEN_FOR_GITLAB.COM",
"gitlab-mr.accessTokens": {
    "https://gitlab.domain.com": "ACCESS_TOKEN_FOR_GITLAB.DOMAIN.COM"
}
```

### 0.1.1

* Added: Initial error hanlding for creating the MR via the Gitlab API.

### 0.1.0

* Breaking: Changed preferences id from `gitlab` to `gitlab-mr`, and renamed existing preferences.
* Added: Preference to change default branch name from `master`.
* Added: Preference to change default remote repository.
* Added: Initial error handling for required preferences, user inputs, and git operations.
* Updated: README with detailed explanation of first workflow.
* Migrating to public Gitlab.

### 0.0.1

Initial release. Proof of concept, no error handling.

### Open Source

* Visual Studio Marketplace: [https://marketplace.visualstudio.com/items?itemName=jasonn-porch.gitlab-mr](https://marketplace.visualstudio.com/items?itemName=jasonn-porch.gitlab-mr)
* Repo: [https://gitlab.com/jasonnutter/vscode-gitlab-mr](https://gitlab.com/jasonnutter/vscode-gitlab-mr)
* Issues: [https://gitlab.com/jasonnutter/vscode-gitlab-mr/issues](https://gitlab.com/jasonnutter/vscode-gitlab-mr/issues)
