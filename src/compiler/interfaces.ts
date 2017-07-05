export * from '../util/interfaces';
import { Bundle, ComponentMeta, Diagnostic, Manifest, LoadComponentRegistry } from '../util/interfaces';


export interface CompilerConfig {
  rootDir?: string;
  srcDir: string;
  collectionDir?: string;
  exclude?: string[];
  devMode?: boolean;
  watch?: boolean;
  bundles?: Bundle[];
  collection?: boolean;
  declaration?: boolean;
  lib?: string[];
  module?: 'es2015' | 'commonjs';
  sourceMap?: boolean;
  target?: 'es5' | 'es2015';
}


export interface BundlerConfig {
  namespace: string;
  srcDir: string;
  destDir: string;
  devMode?: boolean;
  attachRegistryTo?: 'core'|'loader';
  watch?: boolean;
  attrCase?: number;
  manifest: Manifest;
}


export interface ModuleFileMeta {
  tsfilePath?: string;
  tsText?: string;
  jsFilePath?: string;
  jsText?: string;
  hasCmpClass?: boolean;
  cmpMeta?: ComponentMeta;
  cmpClassName?: string;
  includedSassFiles?: string[];
}


export interface ModuleFiles {
  [filePath: string]: ModuleFileMeta;
}


export interface CompileResults {
  moduleFiles: ModuleFiles;
  diagnostics: Diagnostic[];
  manifest?: Manifest;
  filesToWrite: FilesToWrite;
  includedSassFiles?: string[];
  workerId?: number;
}


export interface TranspileResults {
  moduleFiles: ModuleFiles;
  diagnostics: Diagnostic[];
}


export interface ModuleResults {
  bundles: {
    [bundleId: string]: string;
  };
  filesToWrite: FilesToWrite;
  diagnostics: Diagnostic[];
}


export interface FilesToWrite {
  [filePath: string]: string;
}


export interface StylesResults {
  bundles: {
    [bundleId: string]: {
      [modeName: string]: string;
    };
  };
  filesToWrite: FilesToWrite;
  diagnostics: Diagnostic[];
}


export interface BundleResults {
  filesToWrite: FilesToWrite;
  diagnostics: Diagnostic[];
  componentRegistry: LoadComponentRegistry[];
}


export interface BuildResults {
  diagnostics: Diagnostic[];
  manifest: Manifest;
  componentRegistry: LoadComponentRegistry[];
}
