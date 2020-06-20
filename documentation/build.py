#!/usr/bin/env python3
import subprocess

if __name__ == '__main__':
    installedModules: list = subprocess.check_output(['python3', '-m', 'pip', 'list', '--format=legacy']).decode('utf-8').split('\n')
    modulesToInstall: list = ['mkdocs', 'mkdocs-windmill']

    for installedModule in installedModules:
        modulesToInstall = list(filter(lambda module: not installedModule.strip().startswith(module + ' '), modulesToInstall))

    for module in modulesToInstall:
        print(f'Installing missing module ${module}')
        if subprocess.call(['python3', '-m', 'pip', 'install', module]) != 0:
            print(f'Could not install module ${module}')
            exit(1)

    print('Calling MkDocs')
    exit (subprocess.call(['python3', '-m', 'mkdocs', 'build']))