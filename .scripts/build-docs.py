#!/usr/bin/env python3

# What this file does:
#  + It creates the files 'dependencies.md' and 'services.md' based on the 'package.json' files
#  + It adjusts the number for the 'services implemented' field in 'index.md'
# 
# Requirements:
#  + python3 in your PATH
#  + executed from root of nodecg-io repo
#  + docs repo located at ./docs and up to date

import json
import os
import re


def genServicesMd(outFile, baseDir, docDir, outGraph):
    services_implemented = 0

    with open(outFile, mode='w') as out:
        out.write('<!-- This file is auto-generated. Do not change anything here -->\n')
        out.write('# Available nodecg-io services\n')
        out.write('\n')

        depList = []
        relationList = []

        if os.path.exists(baseDir + os.path.sep + 'nodecg-io-core'):
            appendBundle(out, baseDir + os.path.sep + 'nodecg-io-core', 'nodecg-io-core', baseDir, docDir, outGraph, depList, relationList, is_core=True)

        for dir in sorted([x[0] for x in os.walk(baseDir)]):
            relstr = str(os.path.relpath(dir.strip(), baseDir))
            if not 'node_modules' in relstr:
                if appendBundle(out, dir, relstr, baseDir, docDir, outGraph, depList, relationList):
                    services_implemented += 1

        outGraph.writelines(relationList)

    with open(docDir + os.path.sep + 'index.md') as index_in:
        index_data = index_in.read()

    servicesImplementedPattern = re.compile(
        r'https://img\.shields\.io/static/v1\?label=Services%20implemented&message=\d+&color=blue&style=flat-square')
    index_data = servicesImplementedPattern.sub(
        f'https://img.shields.io/static/v1?label=Services%20implemented&message={services_implemented}&color=blue&style=flat-square',
        index_data)

    with open(docDir + os.path.sep + 'index.md', mode='w') as index_out:
        index_out.write(index_data)



def appendBundle(out, dir, reldir, baseDepDir, baseDocDir, outGraph, depList, relationList, is_core = False):
    if dir.endswith('/') or dir.endswith('\\'):
        dir = dir[:-1]
    if not os.path.exists(dir + os.path.sep + 'package.json'):
        return False
    with open(dir + os.path.sep + 'package.json') as r:
        data = json.load(r)
        if (data['name'] != 'nodecg-io-core' or is_core) and 'keywords' in data and 'nodecg-bundle' in data['keywords']:
            out.write(f'## [{data["name"]}](https://github.com/codeoverflow-org/nodecg-io/tree/master/{reldir})\n')
            out.write('\n')

            if 'description' in data and data['description'].strip() != '':
                out.write('**' + data['description'] + '**\n')
            else:
                out.write('**No description**\n')
            out.write('\n')

            if not is_core:
                sampleName = data['name'][10:] # Clip off the 'nodecg-io-' part
                if os.path.exists(baseDocDir + os.path.sep + 'samples' + os.path.sep + sampleName + '.md'):
                    with open(baseDocDir + os.path.sep + 'samples' + os.path.sep + sampleName + '.md') as infile:
                        if infile.readline().strip() == '<!-- Marker for build.py that there\'s no sample bundle. Remove this if you created one -->':
                            out.write(f'There\'s no sample implementation for this service yet.\n')
                        else:
                            out.write(f'See the [sample implementation](samples/{sampleName}.md)\n')
                else:
                    out.write(f'There\'s no sample implementation for this service yet.\n')
                out.write('\n')

            if 'dependencies' in data:
                if not data['name'] in depList:
                    if data['name'] == 'nodecg-io-core':
                        outGraph.write(f'[<u>{data["name"]}] as {reldir.replace(os.path.sep, "_").replace(".", "_").replace("-", "_").replace("/", "_").replace("@", "")} <<core>> [[https://github.com/codeoverflow-org/nodecg-io/tree/master/{reldir}]]\n')
                    else:
                        outGraph.write(f'[<u>{data["name"]}] as {reldir.replace(os.path.sep, "_").replace(".", "_").replace("-", "_").replace("/", "_").replace("@", "")} <<service>> [[https://github.com/codeoverflow-org/nodecg-io/tree/master/{reldir}]]\n')
                depList.append(data['name'])

                for dependency in data['dependencies']:
                    if os.path.exists(baseDepDir + os.path.sep + dependency):
                        depurl = f'https://github.com/codeoverflow-org/nodecg-io/tree/master/{dependency.replace(os.path.sep, "/")}'
                        lineStyle = '-->'
                    else:
                        depurl = f'https://www.npmjs.com/package/{dependency.replace(os.path.sep, "/")}'
                        lineStyle = '...>'

                    if not dependency in depList:
                        outGraph.write(f'[<u>{dependency}] as {dependency.replace(os.path.sep, "_").replace(".", "_").replace("-", "_").replace("/", "_").replace("@", "")} <<lib>> [[{depurl}]]\n')
                        depList.append(dependency)
                    relationList.append(reldir.replace(os.path.sep, "_").replace(".", "_").replace("-", "_").replace("/", "_").replace("@", "") + ' ' + lineStyle + ' ' + dependency.replace(os.path.sep, "_").replace(".", "_").replace("-", "_").replace("/", "_").replace("@", "") + '\n')

                    out.write(f'Depends on [{dependency}]({depurl}) @ {data["dependencies"][dependency]} <br>\n')

                out.write('\n')

            return True
    return False


if __name__ == '__main__':

    print('Generating Markdown Files')
    with open('./docs/docs/dependencies.md', mode='w') as outGraph:
        outGraph.write('<!-- This file is auto-generated. Do not change anything here -->\n')
        outGraph.write('# Dependency Graph\n')
        outGraph.write('\n')
        outGraph.write('::uml:: format="svg_inline" classes="uml" alt="PlantUML dependency graph" title="PlantUML dependency graph"\n')
        outGraph.write('left to right direction\n')
        outGraph.write('skinparam HyperlinkColor White\n')
        outGraph.write('skinparam component {\n')
        outGraph.write('ArrowColor Gainsboro\n')
        outGraph.write('BackgroundColor<<core>> Crimson\n')
        outGraph.write('BackgroundColor<<service>> Darkorange\n')
        outGraph.write('BackgroundColor<<lib>> GoldenRod\n')
        outGraph.write('BorderColor Black\n')
        outGraph.write('FontColor White\n')
        outGraph.write('FontStyle Underline\n')
        outGraph.write('}\n')
        genServicesMd('./docs/docs/services.md', '.', './docs/docs', outGraph)
        outGraph.write('::end-uml::\n')
        print('Completed Task! Files were generated successfully')
