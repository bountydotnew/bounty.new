import type { VSCode } from '../types';

class VSCodeAPIWrapper {
  private readonly vsCodeApi: VSCode | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  public postMessage(message: any) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log('[VSCode API] Message would be sent:', message);
    }
  }

  public getState(): any {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    }
    return null;
  }

  public setState(state: any) {
    if (this.vsCodeApi) {
      this.vsCodeApi.setState(state);
    }
  }
}

export const vscode = new VSCodeAPIWrapper();
