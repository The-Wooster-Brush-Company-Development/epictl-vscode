# epictl-vscode

This is an extension that allows you to manage custom code of various Epicor environments through their REST API in conjunction with the `epictl` project. Within this extension you'll be able to create, edit, and update the custom code in your BPMs.

## Features

Epictl provides a comprehensive set of features that streamline the development and maintenance of Epicor BPMs.

### Epicor Tree View

Browse your Epicor BPMs directly from the VS Code Primary Sidebar.

- View Method and Data Directives
- Expand Directives to view BPMs
- Quick navigation between Directives and BPM's

### BPM Editor

Selecting a BPM will display its data in the BPM panel. Quickly update various fields with inline editing.

- View associated metadata
- View a preview of its associated code
- Update supported BPM fields

### Code Preview and Validation

Preview BPM code without leaving the explorer and validate your BPM code using Epicor.

- Display server-side BPM code
- Display local code files linked through manifests
- Large files are truncated for quick viewing
- Quickly view Compiler diagnostics and error reporting in VS Code

### Manifest Management

Create and maintain BPM manifest files directly from VS Code.

- Initialize new BPMs
- Clone existing BPMs
- Associate local code files with BPMs

### Local Code Integration

Edit, validate, and maintain BPM code

- Quickly jump between BPMs and code files
- Open linked code files
- Create new code files

### Smart BPM Detection

Automatically identifies the BPM associated with the active code file.

- Validate code, update BPMs, and apply changes with fewer inputs.

### Workspace Configuration

Configure Epictl per workspace

- Code directory
- Manifest directory
- Epictl executable
- Relative and absolute path support

### Command Palette Integration

All major functionality is available from the Command Palette

- Support keyboard driven workflows

## Usage

Epictl-vscode supports the end-to-end development of BPMs.

### Creating a new BPM and code file

- Initialize a new manifest file using the BPM View
- Set preliminary information following the provided input fields
- Refresh the Tree View to observe the newly created BPMs

### Cloning an existing BPM

- Clone an existing BPM using the BPM View's clone button
- Immediately gain access to the BPM's data and code file
- Update and apply changes directly from the workspace

### Updating and applying BPM edits

- Update a BPM using the BPM View's inline editing, or with the **Epictl: Update BPM** palette command for additional options.
- Apply edits using the BPM View's apply button or the **Epictl: Apply BPM** palette command

## Known Limitations

Currently `epictl-vscode` and `epictl` only support the modification of Data and Method Directive BPMs. In the future there may be support for managing functions as well.

Once an update method has been chosen either BPM View or command palette, apply must be invoked using the same method.

## Requirements

This extension requires a binary to `epictl`. A command-line interface for managing Epicor custom-code.

## Extension Settings

This extension contributes the following settings, available under the **Context Menu** or through the **Epictl: Set Executable Path** and **Epictl: Set Code Directory Path** commands.

| Setting                    | Description                                                |
| -------------------------- | ---------------------------------------------------------- |
| `epictl.command_path`      | Path to the `epictl` executable.                           |
| `epictl.manifest_dir_path` | Path to the directory where BPM manifest files are stored. |

## Release Notes

### 0.0.1

Initial release of ...

- Managing connections to environments
- Browsing existing code on Epicor environments
- Cloning code down
- Pushing revised code up
- Validating custom code within the extension
