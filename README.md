# vscode-gitlab README

VS Code extension for working with Gitlab Merge Requests.

Visual Studio Marketplace: [https://marketplace.visualstudio.com/items?itemName=jasonn-porch.gitlab-mr](https://marketplace.visualstudio.com/items?itemName=jasonn-porch.gitlab-mr)

## Supported Workflows

### Merge Request from master (uncommitted changes)

This workflow is for creating an MR from uncommitted changes in your `master` branch.

1. Switch to `master` and make changes you want to open an MR for.
2. Open the command palette and select "Gitlab MR: MR from master".
3. First, input the name of the branch you want created for this MR.
4. Next, provide the commit message for the changes.

At this point, the following will happen:
1. The new branch will be created and checked out.
2. All changes files will be committed with the provided commit message.
3. The branch will be pushed to your Gitlab server.
4. An MR will be created to the branch specified as `gitlab-mr.targetBranch` (defaults to `master`) from the new branch.
5. A message will be shown in VS Code with a link to the MR.

## Extension Settings

* `gitlab-mr.gitlabUrl`: Url for the Gitlab server (defaults to `https://gitlab.com`).
* `gitlab-mr.accessToken`: Access token to use to connect to Gitlab API. Create one by going to Profile Settings -> Access Tokens.
* `gitlab-mr.targetBranch`: Default target branch for MRs (defaults to `master`).
* `gitlab-mr.targetRemote`: Default target remote for MRs (defaults to `origin`).

## Known Issues

* `https`: Haven't determined workflow for pushing to `https` remotes if you are not already authenticated.

## Release Notes

### 0.1.1

* Initial error hanlding for creating the MR via the Gitlab API.

### 0.1.0

* Breaking: Changed preferences id from `gitlab` to `gitlab-mr`, and renamed existing preferences.
* Added preference to change default branch name from `master`.
* Added preference to change default remote repository.
* Initial error handling for required preferences, user inputs, and git operations.
* Updated README with detailed explanation of first workflow.
* Migrating to public Gitlab.

### 0.0.1

Initial release. Proof of concept, no error handling.

### Open Source

* Repo: [https://gitlab.com/jasonnutter/vscode-gitlab-mr](https://gitlab.com/jasonnutter/vscode-gitlab-mr)
* Issues: [https://gitlab.com/jasonnutter/vscode-gitlab-mr/issues](https://gitlab.com/jasonnutter/vscode-gitlab-mr/issues)
