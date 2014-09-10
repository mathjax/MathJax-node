/*

   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

 */
import java.io.IOException;
import java.net.URL;

import javax.swing.JApplet; 

import org.apache.batik.dom.svg.SAXSVGDocumentFactory;
import org.apache.batik.swing.JSVGCanvas;
import org.apache.batik.util.XMLResourceDescriptor;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;

/**
 * A applet demonstrating the JSVGCanvas.
 *
 * @version $Id$
 */
public class AppletDemo extends JApplet {

    protected JSVGCanvas canvas;

    protected Document doc;

    protected Element svg;

    public void init() {
        // Create a new JSVGCanvas.
        canvas = new JSVGCanvas();
        getContentPane().add(canvas);

        try {
            // Parse the barChart.svg file into a Document.
            String parser = XMLResourceDescriptor.getXMLParserClassName();
            SAXSVGDocumentFactory f = new SAXSVGDocumentFactory(parser);
            URL url = new URL(getCodeBase(), "barChart.svg");
            doc = f.createDocument(url.toString());

            svg = doc.getDocumentElement();

            // Change the document viewBox.
            svg.setAttributeNS(null, "viewBox", "40 95 370 265");

            // Make the text look nice.
            svg.setAttributeNS(null, "text-rendering", "geometricPrecision");

            // Remove the xml-stylesheet PI.
            for (Node n = svg.getPreviousSibling();
                    n != null;
                    n = n.getPreviousSibling()) {
                if (n.getNodeType() == Node.PROCESSING_INSTRUCTION_NODE) {
                    doc.removeChild(n);
                    break;
                }
            }

            // Remove the Batik sample mark 'use' element.
            for (Node n = svg.getLastChild();
                    n != null;
                    n = n.getPreviousSibling()) {
                if (n.getNodeType() == Node.ELEMENT_NODE
                        && n.getLocalName().equals("use")) {
                    svg.removeChild(n);
                    break;
                }
            }
        } catch (Exception ex) {
        }
    }

    public void start() {
        // Display the document.
        canvas.setDocumentState(JSVGCanvas.ALWAYS_DYNAMIC);
        canvas.setDocument(doc);
    }

    public void stop() {
        // Remove the document.
        canvas.setDocument(null);
    }

    public void destroy() {
        canvas.dispose();
    }

    public void updateBar(final String name, final float value) {
        canvas.getUpdateManager().getUpdateRunnableQueue().invokeLater
            (new Runnable() {
                public void run() {
                    Element bar = doc.getElementById(name);
                    if (bar == null) {
                        return;
                    }

                    Node n;
                    Element path1, path2, path3;
                    for (n = bar.getFirstChild();
                            n.getNodeType() != Node.ELEMENT_NODE;
                            n = n.getNextSibling()) {
                    }
                    path1 = (Element) n;
                    for (n = n.getNextSibling();
                            n.getNodeType() != Node.ELEMENT_NODE;
                            n = n.getNextSibling()) {
                    }
                    path2 = (Element) n;
                    for (n = n.getNextSibling();
                            n.getNodeType() != Node.ELEMENT_NODE;
                            n = n.getNextSibling()) {
                    }
                    path3 = (Element) n;

                    int offset;
                    if (name.equals("ShoeBar")) {
                        offset = 0;
                    } else if (name.equals("CarBar")) {
                        offset = 79;
                    } else if (name.equals("TravelBar")) {
                        offset = 158;
                    } else {
                        offset = 237;
                    }

                    String d =
                        "M " + (offset + 86) + ",240 v -" + (3.7 * value) + " l 15,-15 v " + (3.7 * value) + " l -15,15 z";
                    path1.setAttributeNS(null, "d", d);
                    d = "M " + (offset + 86) + "," + (240 - 3.7 * value) + " h -39 l 15,-15 h 39 l -15,15 z";
                    path2.setAttributeNS(null, "d", d);
                    d = "M " + (offset + 47) + "," + (240 - 3.7 * value) + " v " + (3.7 * value) + " h 39 v -" + (3.7 * value) + " h -39 z";
                    path3.setAttributeNS(null, "d", d);
                }
            });
    }
}
