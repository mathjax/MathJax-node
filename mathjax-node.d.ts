// Project: https://github.com/mathjax/MathJax-node
// TypeScript Version: 2.6.2

declare module 'mathjax-node' {
    import { JSDOM } from 'jsdom';
    export interface MathJaxConfig {
        displayMessages?: boolean,    // determines whether Message.Set() calls are logged
        displayErrors?: boolean,     // determines whether error messages are shown on the console
        undefinedCharError?: boolean, // determines whether "unknown characters" (i.e., no glyph in the configured fonts) are saved in the error array
        extensions?: string[],            // a convenience option to add MathJax extensions
        fontURL?: string, // for webfont urls in the CSS for HTML output
        paths?: { [key: string]: string },                  // configures custom path variables (e.g., for third party extensions, cf. test/config-third-party-extensions.js)
        // standard MathJax configuration options, see https://docs.mathjax.org for more detail.
        MathJax?: {
            extensions: string[]
        }               
    }

    type EquationNumbers = 'none' | 'AMS' | 'all';
    type InputFormat = 'TeX' | 'inline-TeX' | 'AsciiMath' | 'MathML';
    type xmlns = "mml";

    // the state object (if useGlobalCache or equationNumbers is set)
    export interface MathJaxState {
        glyphs: any[]         // a collection of glyph data
        defs: string,          // a string containing SVG def elements
        AMS: {
            startNumber: number  // the current starting equation number
            labels: any,      // the set of labels
            IDs: any     // IDs used in previous equations
        }
    }

    export interface MathJaxOptions {
        ex: number,                          // ex-size in pixels
        width: number,                     // width of container (in ex) for linebreaking and tags
        useFontCache: boolean,             // use <defs> and <use> in svg output?
        useGlobalCache: boolean,          // use common <defs> for all equations?
        linebreaks: boolean,              // automatic linebreaking
        equationNumbers: EquationNumbers,        // automatic equation numbering ("none", "AMS" or "all")
        cjkCharWidth: number,               // width of CJK character

        math: string,                       // the math string to typeset
        format: InputFormat,                  // the input format (TeX, inline-TeX, AsciiMath, or MathML)
        xmlns: xmlns,                   // the namespace to use for MathML

        html: boolean,                    // generate HTML output
        htmlNode: boolean,                // generate HTML output as jsdom node
        css: boolean,                     // generate CSS for HTML output
        mml: boolean,                     // generate MathML output
        mmlNode: boolean,                 // generate MathML output as jsdom node
        svg: boolean,                     // generate SVG output
        svgNode: boolean,                 // generate SVG output as jsdom node

        speakText: boolean,                // add textual alternative (for TeX/asciimath the input string, for MathML a dummy string)

        state: MathJaxState,                      // an object to store information from multiple calls (e.g., <defs> if useGlobalCache, counter for equation numbering if equationNumbers ar )
        timeout: number,             // 10 second timeout before restarting MathJax

    }

    export interface MathJaxResult {
        errors: string[],                   // an array of MathJax error messages if any errors occurred
        mml: string,                   // a string of MathML markup if requested
        mmlNode: JSDOM,                  // a jsdom node of MathML markup if requested
        html: string,                 // a string of HTML markup if requested
        htmlNode: JSDOM,                  // a jsdom node of HTML markup if requested
        css: string,                // a string of CSS if HTML was requested
        svg: string,                 // a string of SVG markup if requested
        svgNode: JSDOM,                   // a jsdom node of SVG markup if requested
        style: string,                // a string of CSS inline style if SVG requested
        height: string,                // a string containing the height of the SVG output if SVG was requested
        width: string,                // a string containing the width of the SVG output if SVG was requested
        speakText: string,               // a string of speech text if requested
        state: MathJaxState
    }

    export type ResultCallback = (result: MathJaxResult, options: MathJaxOptions) => any;

    export default class MathJax {
        /**
         * The config method is used to set global configuration options.
         * Note: Changes to these options require a restart of the API using the start()
         * @param config
         */
        config(config: MathJaxConfig): void

        /**
         * The start method start (and restarts) mathjax-node. This allows reconfiguration.
         * Note: This is done automatically when typeset is first called.
         * */
        start(): void

        /**
         * The typeset method is the main method of mathjax-node. It expects a configuration object options and optionally a callback.
         * If no callback is passed, it will return a Promise.
         * Once called, typeset can be called repeatedly and will optionally store information across calls, see MathJaxState.
         * It returns two objects to Promise.resolve or callback: a result object and the original input options.
         * 
         * If the errors array is non-empty, the Promise will reject, and be passed the errors array.
         * The options object contains the configuration object passed to typeset,
         * This can be useful for passing other data along or for identifying which typeset() call is associated with this (callback) call (in case you use the same callback function for more than one typeset()).

         * 
         * @param options
         */
        typeset(options: MathJaxOptions): Promise<[MathJaxResult, MathJaxOptions]>
        typeset(options: MathJaxOptions, callback?: ResultCallback): void
    }

}
