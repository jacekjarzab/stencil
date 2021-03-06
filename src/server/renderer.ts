import * as interfaces from '../util/interfaces';
import { DEFAULT_PRERENDER_CONFIG } from '../compiler/prerender/validate-prerender-config';
import { getBuildContext } from '../compiler/util';
import { getRegistryJsonWWW, getGlobalWWW } from '../compiler/app/generate-app-files';
import { hydrateHtml } from './hydrate-html';
import { parseComponentRegistry } from '../util/data-parse';
import { validateBuildConfig } from '../compiler/build/validation';


export function createRenderer(config: interfaces.BuildConfig, registry?: interfaces.ComponentRegistry, ctx?: interfaces.BuildContext) {
  ctx = ctx || {};

  // setup the config and add defaults for missing properties
  validateRendererConfig(config, ctx);

  if (!registry) {
    // figure out the component registry
    // if one wasn't passed in already
    registry = registerComponents(config);
  }

  // overload with two options for hydrateToString
  // one that returns a promise, and one that takes a callback as the last arg
  function hydrateToString(hydrateOpts: interfaces.HydrateOptions): Promise<interfaces.HydrateResults>;
  function hydrateToString(hydrateOpts: interfaces.HydrateOptions, callback: (hydrateResults: interfaces.HydrateResults) => void): void;
  function hydrateToString(opts: interfaces.HydrateOptions, callback?: (hydrateResults: interfaces.HydrateResults) => void): any {

    const hydrateResults: interfaces.HydrateResults = {
      diagnostics: [],
      html: opts.html,
      styles: null,
      anchors: []
    };

    // only create a promise if the last argument
    // is not a callback function
    // always resolve cuz any errors are in the diagnostics
    let promise: Promise<any>;
    if (typeof callback !== 'function') {
      promise = new Promise(resolve => {
        callback = resolve;
      });
    }

    try {
      // validate the hydrate options and add any missing info
      validateHydrateOptions(config, opts);
      hydrateResults.url = opts.url;

      // kick off hydrated, which is an async opertion
      hydrateHtml(config, ctx, registry, opts, hydrateResults, callback);

    } catch (e) {
      hydrateResults.diagnostics.push({
        type: 'hydrate',
        level: 'error',
        header: 'Hydrate HTML',
        messageText: e
      });
      callback(hydrateResults);
    }

    // the promise will be undefined if a callback
    // was passed in as the last argument to hydrateToString()
    return promise;
  }

  return {
    hydrateToString: hydrateToString,
    logger: config.logger
  };
}


function registerComponents(config: interfaces.BuildConfig) {
  let registry: interfaces.ComponentRegistry = null;

  try {
    const registryJsonFilePath = getRegistryJsonWWW(config);

    // open up the registry json file
    const cmpRegistryJson = config.sys.fs.readFileSync(registryJsonFilePath, 'utf-8');

    // parse the json into js object
    const registryData = JSON.parse(cmpRegistryJson);

    // object should have the components property on it
    const components: interfaces.LoadComponentRegistry[] = registryData.components;

    if (Array.isArray(components) && components.length > 0) {
      // i think we're good, let's create a registry
      // object to fill up with component data
      registry = {};

      // each component should be a LoadComponentRegistry interface
      components.forEach(cmpRegistryData => {
        // parse the LoadComponentRegistry data and
        // move it to the ComponentRegistry data
        parseComponentRegistry(cmpRegistryData, registry);
      });

    } else {
      throw new Error(`No components were found within the registry data`);
    }

  } catch (e) {
    throw new Error(`Unable to open component registry: ${e}`);
  }

  return registry;
}


function validateHydrateOptions(config: interfaces.BuildConfig, opts: interfaces.HydrateOptions) {
  const req = opts.req;

  if (req && typeof req.get === 'function') {
    // assuming node express request object
    // https://expressjs.com/
    if (!opts.url) opts.url = req.protocol + '://' + req.get('host') + req.originalUrl;
    if (!opts.referrer) opts.referrer = req.get('referrer');
    if (!opts.userAgent) opts.userAgent = req.get('user-agent');
    if (!opts.cookie) opts.cookie = req.get('cookie');
  }

  if (!opts.url) {
    opts.url = '/';
  }

  const urlObj = config.sys.url.parse(opts.url);
  if (!urlObj.protocol) urlObj.protocol = 'https:';
  if (!urlObj.hostname) urlObj.hostname = DEFAULT_PRERENDER_CONFIG.host;

  opts.url = config.sys.url.format(urlObj);
}


function validateRendererConfig(config: interfaces.BuildConfig, ctx: interfaces.BuildContext) {
  if (!config.sys && require) {
    // assuming we're in a node environment,
    // if the config was not provided then use the
    // defaul stencil sys found in bin
    const path = require('path');
    config.sys = require(path.join(__dirname, '../../bin/sys'));
  }

  if (!config.logger && require) {
    // assuming we're in a node environment,
    // if a logger was not provided then use the
    // defaul stencil command line logger found in bin
    const path = require('path');
    const logger = require(path.join(__dirname, '../cli/util')).logger;
    config.logger = new logger.CommandLineLogger({
      level: config.logLevel,
      process: process
    });
  }

  validateBuildConfig(config);

  // create the build context if it doesn't exist
  getBuildContext(ctx);

  loadAppGlobal(config, ctx);
}


function loadAppGlobal(config: interfaces.BuildConfig, ctx: interfaces.BuildContext) {
  ctx.appFiles = ctx.appFiles || {};

  if (ctx.appFiles.global) {
    // already loaded the global js content
    return;
  }

  // let's load the app global js content
  const appGlobalPath = getGlobalWWW(config);
  try {
    ctx.appFiles.global = config.sys.fs.readFileSync(appGlobalPath, 'utf-8');

  } catch (e) {
    config.logger.debug(`missing app global: ${appGlobalPath}`);
  }
}
