import fetch from 'node-fetch'

export class IntelliJ {
    private address: string

    public constructor(address: string) {
        this.address = address
        if (address.includes('://')) {
            this.address = address
        } else {
            this.address = 'http://' + address
        }
    }

    /**
     * Gets the Default-Project with the given name. The Project must be opened. If
     * the project is not found or not open, the promise is rejected.
     */
    async getActiveProject(): Promise<IntelliJProject> {
        const result = await this.rawRequest('get_project', {})
        if (result != null) {
            return new IntelliJProject(this, result)
        } else {
            throw new Error('No project active')
        }
    }


    /**
     * Gets the IntelliJ-Project with the given name. The Project must be opened. If
     * the project is not found or not open, the promise is rejected.
     */
    async getProject(projectName: string): Promise<IntelliJProject> {
        const result = await this.rawRequest('get_project', { "project": projectName })
        if (result != null) {
            return new IntelliJProject(this, result)
        } else {
            throw new Error('Project not found')
        }
    }

    /**
     * Gets the given URL as an IntelliJFile. If the file is not found, the promise is
     * rejected.
     */
    async getFile(url: string): Promise<IntelliJFile> {
        const result = await this.rawRequest('vfs_get_by_url', { "url": url })
        if (result != null) {
            return new IntelliJFile(this, result)
        } else {
            throw new Error('File not found')
        }
    }

    /**
     * Makes a raw request to IntelliJ
     */
    async rawRequest(method: string, data: any): Promise<any> {
        const response = await fetch(this.address, {
            "method": "POST",
            "body": JSON.stringify({
                "method": method,
                "data": data
            })
        })
        const json = await response.json()
        if (json.success) {
            return json.data
        } else if ('error_msg' in json) {
            throw new Error(json.error_msg)
        } else {
            throw new Error("unknown")
        }
    }
}

export class IntelliJProject {
    readonly intellij: IntelliJ
    readonly name: string
    readonly runManager: IntelliJRunManager

    constructor(intellij: IntelliJ, name: string) {
        this.intellij = intellij
        this.name = name
        this.runManager = new IntelliJRunManager(intellij, this)
    }

    /**
     * Gets the currently open file. If there are multiple files open (split screen), the
     * first one is returned. If there are no files open, the promise is rejected.
     */
    async getOpenEditorFile(): Promise<IntelliJFile> {
        const result = await this.intellij.rawRequest('get_open_editor_file', {"project": this.name})
        if (result != null) {
            return new IntelliJFile(this.intellij, result)
        } else {
            throw new Error('File not found')
        }
    }

    /**
     * Checks whether the project is still valid. A project isno longer  valid if it was closed.
     */
    async isValid(): Promise<boolean> {
        return await this.intellij.rawRequest('is_project_valid', {"project": this.name})
    }

    /**
     * Same as `isValid()` but the promise is rejected if the project is not alid any longer.
     */
    async ensureValid(): Promise<void> {
        const result = await this.intellij.rawRequest('is_project_valid', {"project": this.name})
        if (!result) {
            throw new Error("Project is no longer valid")
        }
    }
}

export class IntelliJFile {
    readonly intellij: IntelliJ
    readonly url: string

    constructor(intellij: IntelliJ, vfs_file: string) {
        this.intellij = intellij
        this.url = vfs_file
    }

    /**
     * Gets whether the file exists
     */
    async exists(): Promise<boolean> {
        return await this.intellij.rawRequest('vfs_exists', {"vfs_file": this.url})
    }

    /**
     * Attempts to delete the file from inside the IDE. This won't be detected
     * as an external change.
     */
    async delete(): Promise<void> {
        await this.intellij.rawRequest('vfs_delete', {"vfs_file": this.url})
    }

    /**
     * Gets the size of the file in bytes
     */
    async size(): Promise<number> {
        return await this.intellij.rawRequest('vfs_size', {"vfs_file": this.url})
    }

    /**
     * Checks whther the file is writable
     */
    async isWritable(): Promise<boolean> {
        return await this.intellij.rawRequest('vfs_writable', {"vfs_file": this.url})
    }

    /**
     * Gets the line separator used by the file if any
     */
    async lineSeparator(): Promise<string> {
        return await this.intellij.rawRequest('vfs_line_sep', {"vfs_file": this.url})
    }

    /**
     * Checks whether this IntelliJFile represents a directoy
     */
    async isDirectory(): Promise<boolean> {
        return await this.intellij.rawRequest('vfs_directory', {"vfs_file": this.url})
    }

    /**
     * Checks whether this IntelliJFile is a symbolic link
     */
    async isSymlink(): Promise<boolean> {
        return await this.intellij.rawRequest('vfs_symlink', {"vfs_file": this.url})
    }

    /**
     * Checks whether this IntelliJFile represents neither a directory nor a special file
     */
    async isRegularFile(): Promise<boolean> {
        return await this.intellij.rawRequest('vfs_regular', {"vfs_file": this.url})
    }

    /**
     * Gets the parent of this IntelliJFile
     */
    async parent(): Promise<IntelliJFile> {
        const new_vfs = await this.intellij.rawRequest('vfs_parent', {"vfs_file": this.url})
        return new IntelliJFile(this.intellij, new_vfs)
    }

    /**
     * Sets the text-content of the file. This won't be detected
     * as an external change.
     * @param content The new content
     */
    async setTextContent(content: string): Promise<void> {
        await this.intellij.rawRequest('vfs_set_content_text', {
            "vfs_file": this.url,
            "content": content
        })
    }
    
    /**
     * Sets the binary-content of the file. This won't be detected
     * as an external change.
     * @param content The new content encoded with base64
     */
    async setBinaryContent(content: string): Promise<void> {
        await this.intellij.rawRequest('vfs_set_content_bytes', {
            "vfs_file": this.url,
            "content": content
        })
    }

    /**
     * Gets the text-content of the file.
     */
    async getTextContent(): Promise<string> {
        return await this.intellij.rawRequest('vfs_get_content_text', {"vfs_file": this.url})
    }
    
    /**
     * Gets the binary-content of the file.
     * @returns The content of thefile encoded with base64
     */
    async getBinaryContent(): Promise<string> {
        return await this.intellij.rawRequest('vfs_get_content_bytes', {"vfs_file": this.url})
    }
}

export class IntelliJRunManager {
    readonly intellij: IntelliJ
    readonly project: IntelliJProject

    constructor(intellij: IntelliJ, project: IntelliJProject) {
        this.intellij = intellij
        this.project = project
    }

    /**
     * Gets a run configuration with the given name. If there's no such configuration, the
     * promise is rejected.
     */
    async getConfiguration(name: string): Promise<IntelliJRunConfiguration> {
        const result = await this.intellij.rawRequest('run_get_configuration', {
            "project": this.project.name,
            "configuration": name
        })
        if (result != null) {
            return new IntelliJRunConfiguration(this.intellij, this, result)
        } else {
            throw new Error('Configuration not found')
        }
    }

    /**
     * Gets an array of all run configurations.
     */
    async getConfigurations(): Promise<Array<IntelliJRunConfiguration>> {
        const result = await this.intellij.rawRequest('run_get_configurations', {"project": this.project.name,})
        return result.map((value: string) => { new IntelliJRunConfiguration(this.intellij, this, value) })
    }

    /**
     * Gets the currently selected run configuration.
     */
    async getSelected(): Promise<IntelliJRunConfiguration> {
        const result = await this.intellij.rawRequest('run_get_selected', {"project": this.project.name,})
        if (result != null) {
            return new IntelliJRunConfiguration(this.intellij, this, result)
        } else {
            throw new Error('No configuration selected')
        }   
    }

    /**
     * Gets a type of a run configuration by id. This is something like `gradle`. If there's
     * no such type, the promise is rejected.
     */
    async getType(name: string): Promise<IntelliJRunType> {
        const result = await this.intellij.rawRequest('run_get_type', {
            "project": this.project.name,
            "type": name
        })
        if (result != null) {
            return new IntelliJRunType(this.intellij, this, result)
        } else {
            throw new Error('Configuration-Type not found')
        }
    }

    /**
     * Gets an array of all run configuration types.
     */
    async getTypes(): Promise<Array<IntelliJRunType>> {
        const result = await this.intellij.rawRequest('run_get_types', {
            "project": this.project.name
        })
        return result.map((value: string) => { new IntelliJRunType(this.intellij, this, value) })
    }

    /**
     * Gets an array of all run configurations that ore of the given type.
     */
    async getConfigurationsOfType(type: IntelliJRunType): Promise<Array<IntelliJRunConfiguration>> {
        const result = await this.intellij.rawRequest('run_get_configurations_of_type', {
            "project": this.project.name,
            "type": type.name
        })
        return result.map((value: string) => { new IntelliJRunConfiguration(this.intellij, this, value) })
    }

    /**
     * Adds a new run configuration to the project
     * @param name The name of the new configuration
     * @param type The type of the new configuration
     */
    async addConfiguration(name: string, type: IntelliJRunType): Promise<IntelliJRunConfiguration> {
        const result = await this.intellij.rawRequest('run_add_configuration', {
            "project": this.project.name,
            "type": type.name,
            "name": name
        })
        return new IntelliJRunConfiguration(this.intellij, this, result)
    }
}

export class IntelliJRunConfiguration {
    readonly intellij: IntelliJ
    readonly manager: IntelliJRunManager
    readonly uid: string

    constructor(intellij: IntelliJ, manager: IntelliJRunManager, uid: string) {
        this.intellij = intellij
        this.manager = manager
        this.uid = uid
    }

    /**
     * Gets the type of this run configuration
     */
    async getType(): Promise<IntelliJRunType> {
        const result = await this.intellij.rawRequest('run_get_type_from_configuration', {
            "project": this.manager.project.name,
            "configuration": this.uid
        })
        return new IntelliJRunType(this.intellij, this.manager, result)
    }

    /**
     * Deletes this run configuration
     */
    async delete(): Promise<void> {
        await this.intellij.rawRequest('run_remove_configuration', {
            "project": this.manager.project.name,
            "configuration": this.uid
        })
    }

    /**
     * Gets the name of this run configuration
     */
    async getName(): Promise<string> {
        return await this.intellij.rawRequest('run_get_configuration_name', {
            "project": this.manager.project.name,
            "configuration": this.uid
        })
    }

    /**
     * Checks whether this run configuration is a template
     */
    async isTemplate(): Promise<boolean> {
        return await this.intellij.rawRequest('run_get_configuration_is_template', {
            "project": this.manager.project.name,
            "configuration": this.uid
        })
    }

    /**
     * Runs this configuration
     */
    async run(): Promise<void> {
        await this.intellij.rawRequest('run_start_configuration', {
            "project": this.manager.project.name,
            "configuration": this.uid
        })
    }
}

export class IntelliJRunType {
    readonly intellij: IntelliJ
    readonly manager: IntelliJRunManager
    readonly name: string

    constructor(intellij: IntelliJ, manager: IntelliJRunManager, name: string) {
        this.intellij = intellij
        this.manager = manager
        this.name = name
    }

    /**
     * Gets the name of this run configuration type.
     */
    async getName(): Promise<string> {
        return await this.intellij.rawRequest('run_get_type_name', {
            "project": this.manager.project.name,
            "type": name
        })
    }

    /**
     * Gets the description for this run configuration type.
     */
    async getDescription(): Promise<string> {
        return await this.intellij.rawRequest('run_get_type_description', {
            "project": this.manager.project.name,
            "type": name
        })
    }
}