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

Epictl-vscode supports the end-to-end development of Epicor BPMs through the **Epictl Sidebar** and the **VS Code Command Palette**. Most functionality is available from either interface, allowing you to choose the workflow that best fits your development style.

### Opening the Epictl Sidebar

- Navigate to and click on the lightning bolt icon in the **Primary Side Bar**.
- Once launched, the Epictl Sidebar will open with three views:
  - **BPM Menu**
  - **Context Menu**
  - **Epictl Explorer**

### Configuring your Work Environment

- Use **Epictl: Create Config** to create a workspace configuration.
- Configure your Epicor connection, executable path, and code directory using either the **Context Menu** view or the corresponding **Command Palette** commands.
  - **Epictl: Set Config**
  - **Epictl: Get Config**
  - **Epictl: Active Config**
  - **Epictl: Delete Config**
  - **Epictl: Set Executable Path**
  - **Epictl: Get Executable Path**
  - **Epictl: Delete Executable Path**
  - **Epictl: Set Code Directory Path**
  - **Epictl: Get Code Directory Path**
  - **Epictl: Delete Code Directory Path**

### Creating a new BPM and code file

- Initialize a new manifest file using the **BPM Menu** or by running the corresponding **Command Palette** command.
- Set the preliminary information using the provided input fields.
- Refresh the **Tree View** to view the newly created BPM.

### Cloning an existing BPM

- Clone an existing BPM using the **BPM Menu** or the corresponding **Command Palette** command.
- Immediately gain access to the BPM's data and associated code file.
- Update and apply changes directly from your workspace.

### Updating and applying BPM edits

- Update a BPM using the **BPM Menu**'s inline editing or the **Epictl: Update BPM** Command Palette command for additional update options.
- Apply changes using the **Apply** button in the **BPM Menu** or the **Epictl: Apply BPM** Command Palette command.

### Validating a BPM's Code File

- Validate your code using **Epictl: Validate Code** from the **Command Palette**.
- Alternatively, use the **Apply** button in the **BPM Menu** to validate, update, and apply your BPM code in a single action.

### Navigating the BPM Menu

- Delete, navigate and manage your BPMs with the following BPM Menu buttorns:
  - **Delete BPM for 'BPM Name'**
  - **Refresh BPM**
  - **Open Code File**

### Managing your Manifests

- List your local manifest files using **Epictl: Get Manifests**.
- Quickly display the BPM associated with the active code file using **Epictl: Get Manifest From Code File**.

## Troubleshooting

- If an update operation fails from the **BPM Menu**, click the **Refresh BPM** button to reload the BPM from Epicor and restore the current server values.

- To quickly locate a BPM, use **Epictl: Get Manifest From Code File** while focusing on the BPM's code file path.

## Known Limitations

Currently `epictl-vscode` and `epictl` only support the modification of Data and Method Directive BPMs. In the future there may be support for managing functions as well.

Once an update method has been chosen either BPM View or command palette, apply must be invoked using the same method.

Once initialized, a BPM is perminantly attached to the Bom or Table it was created for.

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
