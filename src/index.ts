import {
    Plugin
} from "siyuan";
import "./index.scss";

export default class PluginCallout extends Plugin {

    onload() {
        console.log(this.i18n.pluginOnload);
    }

    onLayoutReady() {
    }

    onunload() {
        console.log(this.i18n.pluginOnunload);
    }

    uninstall() {
        console.log(this.i18n.pluginUninstall);
    }

    // onDataChanged() {
    // }
}
