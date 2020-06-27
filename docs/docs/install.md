# Installation

## Prerequisites

In order to download necessary tools, clone the repository, and install dependencies via `npm` you need network access.

You'll need the following tools:

- [Git](https://git-scm.com)
- [Node.JS](https://nodejs.org/en/) v12.0.0 or newer
- [Npm](https://www.npmjs.com/get-npm)
- [NodeCG](https://nodecg.com/)



## Clone this repository:
```
git clone https://github.com/codeoverflow-org/nodecg-io.git
```

*Note:* You should clone nodecg-io to somewhere outside of your nodecg bundles/ directory as this repo contains many bundles in subdirectories and nodecg doesn't support nesting of the bundles in other directories. You can clone it to any other path that you wish.


## Install all of the dependencies using `npm`:

```
cd path/to/nodecg-io
npm install
```

## Build nodecg-io: 
```
cd path/to/nodecg-io 
npm run build
```

## Add nodecg-io directory to the nodecg config:

Modify the nodecg configuration in `path/to/nodecg/cfg/nodecg.json`, here is an example config:
```json
{
    "bundles": {
        "paths": ["path/to/nodecg-io", "path/to/nodecg-io/samples"]
    }
}  
```
*Note 1:* This path should point to the root of this repository, not to a bundle inside this repo.

*Note 2:* The second path to the samples is only required if you want to use a sample plugin.
   
*Note 3:* If nodecg doesn't load nodecg-io for some reason you might want to use an absolute path here.

## Start nodecg
Now you can use nodecg-io in your own bundle. You can find example code in [./samples/](https://github.com/codeoverflow-org/nodecg-io/tree/master/samples/).

