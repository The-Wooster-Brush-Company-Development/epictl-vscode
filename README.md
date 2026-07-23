# epictl-vscode

This is an extension that allows you to manage custom code of various Epicor environments through their REST API in conjunction with the `epictl` project. Within this extension you'll be able to create, edit, and update the custom code in your BPMs.

## Features

Epictl provides a comprehensive set of features that streamline the development and maintenance of Epicor BPMs.

<!-- Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace: -->

### Epicor Tree View

Browse your Epicor BPMs directly from the VS Code Primary Sidebar.

- View Method and Data Directives
- Expand Directives to view BPMs
- Quick navigation between Directives and BPM's

### BPM Editor

Selecting a BPM will display its data in the BPM panel. Quickly update various fields with inline editing.

- View associated metada
- View a preview of its associated code
- Update supported BPM fields

### Code Preview and Validation

Preview BPM code without leaving the explorer and validate your BPM code using Epicor.

- Dispaly server-side BPM code
- Display local code files linked through manifests
- Large files are truncated for quick viewing
- Quickly view Compiler diognostics and error reporting in VS Code

### Manifest Management

Create and maintain BPM manfiest files directly from VS Code.

- Initialize new BPMs
- Clone existing BPMs
- Associate local code files with BPMs

### Local Code Integration

Edit, validate, and maintain BPM code

- Quickly jump between BPMs and code files
- Open linked code files
- Create new code files

### Workspace Configuration

Configure Epictl per workspace

- Code directory
- Manifest directory
- Epictl exectuable
- Relative and absolute path support

### Command Palette Integration

All major functionality is abailable from the Command Palette

- Support key-board driven workflows

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Known Limitations

Currently `epictl-vscode` and `epictl` only support the modification of Data and Method Directive BPMs. In the future there may be support for managing functions as well.

## Requirements

This extension requires a binary to `epictl`. A command-line interface for managing Epicor custom-code.

## Release Notes

### 0.0.1

Initial release of ...

- Managing connections to environments
- Browsing existing code on Epicor environments
- Cloning code down
- Pushing revised code up
- Validating custom code within the extension
