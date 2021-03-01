#!/usr/bin/env python3

# What this file does:
#  + It creates all required files for a new nodecg-io service
#  + It copies version and dependency information (e.q fpr typescript) from noodecg-io-template
#  + It'll also create a sample and the files for the docs
#
# Requirements:
#  + python3 in your PATH
#  + executed from root of nodecg-io repo
import json
import os
import shutil

if __name__ == '__main__':
    service_name = input('Service name: ').lower()
    description = input('Short description: ')
    author_name = input('Author name: ')
    author_url = input('Author url: ')
    sample_name = input('Sample name: ').lower()

    service_name_c = service_name.replace("-", " ").title().replace(" ", "")
    service_name_cc = service_name_c[0].lower() + service_name_c[1:]

    with open('nodecg-io-template/package.json') as file:
        package = json.loads(file.read())

    # Replace some entries from the template package.json
    package['name'] = f'nodecg-io-{service_name}'
    package['description'] = description
    package['homepage'] = f'https://nodecg.io/samples/{sample_name}'
    package['author'] = {
        'name': author_name,
        'url': author_url
    }
    package['repository']['directory'] = f'nodecg-io-{service_name}'

    os.mkdir(f'nodecg-io-{service_name}')
    with open(f'nodecg-io-{service_name}/package.json', mode='w') as file:
        file.write(json.dumps(package, indent=4))

    shutil.copy('nodecg-io-template/schema.json', f'nodecg-io-{service_name}/schema.json')
    shutil.copy('nodecg-io-template/tsconfig.json', f'nodecg-io-{service_name}/tsconfig.json')

    os.mkdir(f'nodecg-io-{service_name}/extension')
    with open(f'nodecg-io-{service_name}/extension/index.ts', mode='w') as file:
        file.writelines([
            'import { NodeCG } from "nodecg/types/server";\n',
            'import { Result, emptySuccess, success, ServiceBundle } from "nodecg-io-core";\n',
            f'import {{ {service_name_c}Client }} from "./{service_name_cc}Client";\n',
            '\n',
            f'export interface {service_name_c}Config {{\n',
            '    placeholder: string;\n',
            '}\n',
            '\n',
            f'export {{ {service_name_c}Client }} from "./{service_name_cc}Client";\n',
            '\n',
            'module.exports = (nodecg: NodeCG) => {\n',
            f'    new {service_name_c}Service(nodecg, "{service_name}", __dirname, "../schema.json").register();\n',
            '};\n',
            '\n',
            f'class {service_name_c}Service extends ServiceBundle<{service_name_c}Config, {service_name_c}Client> {{\n',
            f'    async validateConfig(_: {service_name_c}Config): Promise<Result<void>> {{\n',
            '        // TODO: Implement\n',
            '        return emptySuccess();\n',
            '    }\n',
            '\n',
            f'    async createClient(config: {service_name_c}Config): Promise<Result<{service_name_c}Client>> {{\n',
            '        // TODO: Implement\n',
            f'        const client = {service_name_c}Client.createClient(config);\n',
            f'        this.nodecg.log.info("Successfully created {service_name} client.");\n',
            '        return success(client);\n',
            '    }\n',
            '\n',
            f'    stopClient(_: {service_name_c}Client): void {{\n',
            '        // TODO: Implement\n',
            f'        this.nodecg.log.info("Successfully stopped {service_name} client.");\n',
            '    }\n',
            '\n',
            f'    removeHandlers(_: {service_name_c}Client): void {{\n',
            '        // TODO: Implement (optional)\n',
            '    }\n',
            '}\n'
        ])

    with open(f'nodecg-io-{service_name}/extension/{service_name_cc}Client.ts', mode='w') as file:
        file.writelines([
            f'import {{ {service_name_c}Config }} from "./index";\n',
            '\n',
            f'export class {service_name_c}Client {{\n',
            f'    constructor(_: {service_name_c}Config) {{\n',
            '        // TODO: Implement\n',
            '    }\n',
            '\n',
            f'    static createClient(config: {service_name_c}Config): {service_name_c}Client {{\n',
            '        // TODO: Implement\n',
            f'        return new {service_name_c}Client(config);\n',
            '    }\n',
            '}\n'
        ])

    with open('samples/template/package.json') as file:
        sample_package = json.loads(file.read())

    sample_dependencies = {}
    for dependency in sample_package['dependencies']:
        if dependency != 'nodecg-io-template':
            sample_dependencies[dependency] = sample_package['dependencies'][dependency]
    sample_dependencies[f'nodecg-io-{service_name}'] = package['version']

    # Replace some entries from the template package.json
    sample_package['name'] = sample_name
    sample_package['dependencies'] = sample_dependencies
    sample_package['nodecg']['bundleDependencies'] = {
        f'nodecg-io-{service_name}': package['version']
    }

    os.mkdir(f'samples/{sample_name}')
    with open(f'samples/{sample_name}/package.json', mode='w') as file:
        file.write(json.dumps(sample_package, indent=4))

    shutil.copy('samples/template/tsconfig.json', f'samples/{sample_name}/tsconfig.json')

    os.mkdir(f'samples/{sample_name}/extension')
    with open(f'samples/{sample_name}/extension/index.ts', mode='w') as file:
        file.writelines([
            'import { NodeCG } from "nodecg/types/server";\n',
            f'import {{ {service_name_c}Client }} from "nodecg-io-{service_name}";\n',
            'import { requireService } from "nodecg-io-core";\n',
            '\n',
            'module.exports = function (nodecg: NodeCG) {\n',
            f'    nodecg.log.info("Sample bundle for {service_name_c} started.");\n',
            '\n',
            f'    const {service_name_cc} = requireService<{service_name_c}Client>(nodecg, "{service_name}");\n',
            '\n',
            f'    {service_name_cc}?.onAvailable((_) => {{\n',
            f'        nodecg.log.info("{service_name_c} service available.");\n',
            '        // TODO: Implement\n',
            '    });\n',
            '\n',
            f'    {service_name_cc}?.onUnavailable(() => {{\n',
            f'        nodecg.log.info("{service_name_c} service unavailable.");\n',
            '        // TODO: Implement\n',
            '    });\n',
            '};\n'
        ])

    if not os.path.isdir('docs'):
        print('Could not create documentation files. You should clone nodecg-io-docs in the directory "docs".')
    else:
        with open(f'docs/docs/samples/{sample_name}.md', mode='w') as file:
            file.writelines([
                '<!-- Marker for build.py that there\'s no sample bundle. Remove this if you created one -->\n',
                '\n',
                f'# Documentation for {service_name_c}-service missing.\n',
                '\n',
                'You can help us [create it](../contribute/sample_documentation.md).'
            ])

    os.system('npm run bsb')

    print(f"\n\nService {service_name_c} created. Please add it to mkdocs.yml")
