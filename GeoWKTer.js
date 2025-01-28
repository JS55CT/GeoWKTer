// ==UserScript==
// @name                GeoWKTer
// @namespace           https://github.com/JS55CT
// @description         geoWKTer is a JavaScript library designed to convert WKT data into GeoJSON format efficiently. It supports conversion of Point, LineString, Polygon, and MultiGeometry elements.
// @version             2.0.0
// @author              JS55CT
// @license             GNU GPLv3
// ==/UserScript==

/***************************************
 * GeoWKTer Constructor Function
 * The `GeoWKTer` function serves as a constructor for creating instances that
 * manage the conversion of Well-Known Text (WKT) strings into GeoJSON representations.
 * It initializes regex patterns used for parsing WKT, and offers a structure to hold
 * spatial features processed from those strings.
 *
 * **Initialization**:
 * - `this.features`: Initializes a member array intended to hold spatial feature 
 *   objects derived from parsed WKT strings. This can be used to store pieces of
 *   geometry for later retrieval or conversion into GeoJSON.
 * 
 * - `this.regExes`: Sets up a collection of regular expressions critical for 
 *   parsing various components of WKT strings:
 *   - `typeStr`: Matches the spatial type and nested geometries or coordinates in a WKT string.
 *   - `spaces`: Intended to capture spaces or plus symbols, typically for splitting coordinate strings.
 *   - `comma`: Used for splitting coordinate pairs that are comma-separated.
 *   - `parenComma`: Targets polygon or multi-geometries where comma-separated lists of coordinates
 *     need to be split, considering parentheses.
 *
 * **Usage Example**:
 * // Create an instance of GeoWKTer
 * const geoWKT = new GeoWKTer();
 *
 * // Example WKT string of a POINT
 * const pointWKT = "POINT (30 10)";
 *
 * // Label for the geometry
 * const label = "Sample Point";
 *
 * // Convert WKT to internal representation and print
 * const internalData = geoWKT.read(pointWKT, label);
 * console.log("Internal Data:", internalData);
 *
 * // Convert internal representation to GeoJSON and print
 * const geoJSON = geoWKT.toGeoJSON(internalData);
 * console.log("GeoJSON:", geoJSON);
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * GeoWKTer inspired by the work of Wicket.js <https://github.com/arthur-e/Wicket>
 * and terraformer <https://github.com/terraformer-js/terraformer/tree/main>
 ****************************************/
var GeoWKTer = (function () {
  function GeoWKTer() {
    this.features = []; // Initialize an array to store parsed feature data
    this.regExes = {
      // Regular expressions for parsing WKT strings
      typeStr: /^\s*(\w+)\s*\((.*)\)\s*$/, // Capture geometry type and contents
      spaces: /\s+|\+/, // Detect spaces or plus signs for splitting coordinates
      comma: /\s*,\s*/, // Capture commas surrounded by optional whitespace
      parenComma: /\)\s*,\s*\(/, // Split on closing parentheses followed by a comma and opening parentheses
    };
  }

  /*****************************************
   * Clean WKT String
   *
   * This function processes a Well-Known Text (WKT) string,
   * removing unnecessary spaces and newlines within
   * parenthesized coordinate lists. It ensures commas have
   * consistent spacing, typically immediately following
   * coordinate values. Primarily targets complex geometries
   * like MULTIPOLYGON, optimizing coordinate definition
   * clarity and compactness.
   *
   * @param {string} wkt - The WKT string to clean.
   * @returns {string} - The cleaned WKT string, with optimized spacing.
   *****************************************/
  GeoWKTer.prototype.cleanWKTString = function (wkt) {
    return wkt
      .replace(/[\n\r]+/g, " ") // Replace newlines with a single space
      .replace(/\s\s+/g, " ") // Replace multiple spaces with a single space
      .replace(/([A-Z]+)\s*\(/g, "$1(") // Ensure no space between type and opening parenthesis
      .replace(/\(\s+/g, "(") // Remove spaces after opening parentheses
      .replace(/\s+\)/g, ")") // Remove spaces before closing parentheses
      .replace(/,\s+/g, ",") // Remove spaces after commas
      .replace(/\s+,/g, ",") // Remove spaces before commas
      .trim(); // Trim leading and trailing whitespaces
  };

  /***************************************
   * Read WKT and Convert to Internal Representation
   * This function takes a Well-Known Text (WKT) string, processes it to produce
   * a cleaned and standardized version, and then converts it to an internal data
   * structure that represents the geometry for further processing or transformation
   * to GeoJSON. This step is crucial for understanding and manipulating spatial data.
   *
   * @param {string} wktText - The original WKT string representing a geometry or
   *                           collection of geometries (e.g., POINT, POLYGON).
   * @param {string} label - A descriptive label or identifier associated with the
   *                         geometry, which will be stored for use in GeoJSON properties.
   * @returns {Object[]} - An array containing a single object with:
   *                        - type: the type of geometry (e.g., POINT, POLYGON).
   *                        - components: the coordinates or geometries depending on type.
   *                        - label: the provided label for this geometry.
   * @throws {Error} - Throws an error if the WKT is malformed or cannot be processed,
   *                   indicating the WKT string is invalid or unsupported.
   *
   * Procedure:
   * 1. Clean WKT String: Utilize `cleanWKTString` to standardize the WKT input,
   *    handling cases like whitespace normalization, and ensuring it matches expected format.
   *
   * 2. Convert to GeoJSON: Pass the cleaned WKT string to `wktToGeoJSON` for transformation
   *    into a GeoJSON-like structure. This process involves parsing the WKT syntax into
   *    an object with a `type` and relevant coordinates or geometries attribute.
   *
   * 3. Construct Internal Representation: Return the parsed structure as a new object with:
   *    - `type`: Captured from the GeoJSON object.
   *    - `components`: The coordinates (or geometries array) reflecting the parsed data.
   *    - `label`: Passed through for later use in properties or identifications.
   *
   * 4. Error Handling: Any failure in parsing triggers an exception with a descriptive message,
   *    alerting the user or developer to malformed or unsupported inputs.
   ****************************************/
  GeoWKTer.prototype.read = function (wktText, label) {
    try {
      // Clean and standardize the input WKT string
      const cleanedWKT = this.cleanWKTString(wktText);

      // Convert the cleaned WKT to a GeoJSON-like structure
      const geoJSON = this.wktToGeoJSON(cleanedWKT);

      // Return the internal representation with the given label
      return [
        {
          type: geoJSON.type, // Extract the geometry type
          components: geoJSON.coordinates || geoJSON.geometries, // Choose coordinates or geometries attribute based on type
          label, // Add the provided label for future reference
        },
      ];
    } catch (error) {
      // Handle and throw errors related to malformed or unsupported WKT
      throw new Error(error.message);
    }
  };

  /***************************************
   * Convert Internal Data Array to GeoJSON
   * This function takes an array of internal data objects—each representing
   * parsed WKT geometries—and converts them into a valid GeoJSON object.
   * Specifically, it structures these geometries into GeoJSON features within
   * a FeatureCollection, appropriately handling both individual geometries
   * and collections of geometries.
   *
   * @param {Object[]} dataArray - An array of objects where each contains:
   *                                - type: the geometric type (e.g., POINT, POLYGON).
   *                                - components: either the coordinates of a
   *                                  single geometry or an array of geometries.
   *                                - label: optional description used as a property.
   * @returns {Object} - GeoJSON object formatted as a FeatureCollection, comprising
   *                     individual features with their associated geometries and properties.
   *
   * Steps Involved:
   * 1. Initialize `features`: Accumulate each processed geometry into this array
   *    as a GeoJSON `Feature`, maintaining a list to be included in the final
   *    `FeatureCollection`.
   *
   * 2. Iterate Over Data Array: For each geometry object from the parsed internal
   *    data:
   *
   *    - **Geometry Collections**:
   *      - Identify the `GEOMETRYCOLLECTION` type and ensure `components` is an array.
   *      - Iterate through each geometry in the collection, converting each into
   *        a GeoJSON `Feature` by specifying its type and coordinates, and pushing
   *        it to the `features` list.
   *
   *    - **Other Geometries**:
   *      - Construct a GeoJSON `Feature` using the individual geometry's `type` and
   *        `coordinates` directly.
   *      - Append each to `features`, ensuring they include property details.
   *
   * 3. Construct FeatureCollection: Wrap the accumulated features array into a
   *    GeoJSON formatted object by designating it as a `FeatureCollection`.
   *
   * This function effectively bridges the gap between parsed WKT geometries and
   * the GeoJSON standard, establishing a structure suitable for applications
   * utilizing GeoJSON data.
   ****************************************/
  GeoWKTer.prototype.toGeoJSON = function (dataArray) {
    // Reduce the internal data array into a GeoJSON features array
    const features = dataArray.reduce((accum, data) => {
      const { type, components, label } = data; // Destructure for ease of use

      if (type === "GEOMETRYCOLLECTION" && Array.isArray(components)) {
        // If it's a geometry collection, iterate over its components
        components.forEach((geometry) => {
          accum.push({
            // Push each as a Feature to the GeoJSON features list
            type: "Feature",
            geometry: {
              // Define the geometry object for GeoJSON
              type: geometry.type,
              coordinates: geometry.coordinates,
            },
            properties: {
              // Attach properties, including label if provided
              Name: label || "",
            },
          });
        });
      } else {
        // Handle non-collection geometries directly as a single GeoJSON feature
        accum.push({
          type: "Feature",
          geometry: {
            // Assign geometry details
            type: type,
            coordinates: components,
          },
          properties: {
            Name: label || "", // Include label as a property if available
          },
        });
      }

      return accum; // Return the accumulator for the next iteration
    }, []);

    // Return the complete GeoJSON FeatureCollection
    return {
      type: "FeatureCollection",
      features: features, // Embed the compiled features
    };
  };

  /***************************************
   * Convert WKT to GeoJSON
   * @param {string} wkt - The WKT string.
   * @returns {Object} - GeoJSON object.
   * @throws {Error} - Throws if WKT is unsupported or invalid.
   ****************************************/
  GeoWKTer.prototype.wktToGeoJSON = function (wkt) {
    const match = this.regExes.typeStr.exec(wkt);
    if (!match) throw new Error("Invalid WKT");

    const type = match[1].toUpperCase();
    const data = match[2];

    const parsers = {
      POINT: this.parsePoint,
      LINESTRING: this.parseLineString,
      POLYGON: this.parsePolygon,
      MULTIPOINT: this.parseMultiPoint,
      MULTILINESTRING: this.parseMultiLineString,
      MULTIPOLYGON: this.parseMultiPolygon,
      GEOMETRYCOLLECTION: this.parseGeometryCollection,
    };

    if (!parsers[type]) {
      throw new Error(`Unsupported WKT type: ${type}`);
    }

    const result = parsers[type].call(this, data);
    if (type === "GEOMETRYCOLLECTION") {
      return { type, geometries: result };
    }

    return { type, coordinates: result };
  };

  /***************************************
   * Parse Point Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[]} - Array of numbers representing the point.
   ****************************************/
  GeoWKTer.prototype.parsePoint = function (str) {
    return str.trim().split(" ").map(Number);
  };

  /***************************************
   * Parse LineString Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[][]} - Array of arrays representing the linestring.
   ****************************************/
  GeoWKTer.prototype.parseLineString = function (str) {
    return str.split(",").map((pair) => {
      return pair.trim().split(" ").map(Number);
    });
  };

  /***************************************
   * Parse Polygon Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[][][]} - Array of arrays representing the polygon.
   ****************************************/
  GeoWKTer.prototype.parsePolygon = function (str) {
    return str.match(/\([^()]+\)/g).map((ring) => {
      return ring
        .replace(/[()]/g, "")
        .split(",")
        .map((pair) => {
          return pair.trim().split(" ").map(Number);
        });
    });
  };

  /***************************************
   * Parse MultiPoint Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[][]} - Array of points representing the multipoint.
   ****************************************/
  GeoWKTer.prototype.parseMultiPoint = function (str) {
    // If the WKT includes nested parentheses
    const matchParenPoints = str.match(/\(\s*([^()]+)\s*\)/g);
    if (matchParenPoints) {
      return matchParenPoints.map((pointStr) => {
        return this.parsePoint(pointStr.replace(/[()]/g, "").trim());
      });
    } else {
      return str.split(",").map(this.parsePoint.bind(this));
    }
  };

  /***************************************
   * Parse MultiLineString Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[][][]} - Array of linestrings representing the multilinestring.
   ****************************************/
  GeoWKTer.prototype.parseMultiLineString = function (str) {
    return str.match(/\(([^()]+)\)/g).map((linestring) => {
      return this.parseLineString(linestring.replace(/[()]/g, "").trim());
    });
  };

  /***************************************
   * Parse MultiPolygon Geometry
   * @param {string} str - The WKT coordinates string.
   * @returns {number[][][][]} - Array of polygons representing the multipolygon.
   ****************************************/
  GeoWKTer.prototype.parseMultiPolygon = function (str) {
    // Match groups of polygons within MULTIPOLYGON
    const polygonMatches = str.match(/\(\([^)]+\)\)/g);

    if (!polygonMatches) {
      throw new Error("Invalid MULTIPOLYGON WKT format");
    }

    return polygonMatches.map((polygonStr) => {
      // Each match represents a polygon, stripping the outer parentheses
      const cleanedPolygonStr = polygonStr.slice(1, -1); // Removes the outermost two parenthesis levels
      return this.parsePolygon(cleanedPolygonStr);
    });
  };

  /***************************************
   * Extract Geometries from WKT GeometryCollection
   * This function scans through a WKT formatted string that represents a
   * GEOMETRYCOLLECTION and identifies individual geometry components within
   * it. The function splits the string into manageable parts, each corresponding
   * to a distinct geometry (e.g., POINT, LINESTRING).
   *
   * @param {string} str - The WKT string containing the collection of geometries.
   * @returns {string[]} - An array of WKT strings, each representing a
   *                       single geometry component from the GEOMETRYCOLLECTION.
   *
   * Procedure:
   * 1. Initialize an array `geometries` to collect extracted WKT segments.
   * 2. Define `geometryTypes`, an array containing the WKT keywords for supported
   *    geometry types, which are POINT, LINESTRING, POLYGON, MULTIPOINT,
   *    MULTILINESTRING, and MULTIPOLYGON.
   * 3. Utilize two variables, `depth` and `start`, to track the nesting level
   *    of parentheses and the start position of each geometry component.
   *
   * Main Loop:
   * - Iterate over each character in the string.
   * - Adjust `depth` to reflect the current level of parenthesis nesting,
   *   incrementing with '(' and decrementing with ')'.
   * - Upon reaching `depth` 0, examine the current location in the string
   *   for potential geometry type keywords.
   * - When a geometry type is detected at `depth` 0, mark the end of the
   *   preceding geometry segment, if any, and append it to `geometries`.
   * - Set `start` to the current index, marking the beginning of the next geometry.
   *
   * Finalization:
   * - After exiting the loop, capture any remaining geometry from `start` to
   *   the end of the string, appending it to the `geometries` list.
   *
   * This approach ensures each nested geometry in a GEOMETRYCOLLECTION is
   * accurately isolated as its own distinct WKT segment, ready for parsing.
   ****************************************/
  GeoWKTer.prototype.extractGeometries = function (str) {
    const geometries = []; // Array to store each extracted geometry WKT
    const geometryTypes = ["POINT", "LINESTRING", "POLYGON", "MULTIPOINT", "MULTILINESTRING", "MULTIPOLYGON"]; // Known geometry types
    let depth = 0; // Tracks current depth level of parentheses
    let start = 0; // Marks the start index of the current geometry segment

    // Iterate over each character in the WKT string
    for (let i = 0; i < str.length; i++) {
      if (str[i] === "(") depth++; // Increment depth for each opening parenthesis
      if (str[i] === ")") depth--; // Decrement depth for each closing parenthesis

      // Check if we're at a zero depth, potentially between geometries
      if (depth === 0) {
        // Explore possible starts of a new geometry type
        geometryTypes.forEach((type) => {
          if (str.startsWith(type, i)) {
            // Check if this point indicates a new geometry type
            if (i > start) {
              // Ensure there's a segment before this new start
              const geometry = str.slice(start, i).trim(); // Extract the previous geometry segment
              if (geometry) {
                // Ensure it's non-empty
                geometries.push(geometry); // Add to the list of extracted geometries
              }
            }
            start = i; // Update start to the current position for the new geometry
          }
        });
      }
    }

    // Process the final segment if there's any left
    if (start < str.length) {
      const geometry = str.slice(start).trim(); // Extract remaining geometry segment
      if (geometry) {
        // Ensure non-empty
        geometries.push(geometry); // Add last geometry
      }
    }

    return geometries; // Return all extracted geometry components
  };

  /***************************************
   * Parse GeometryCollection
   * This function processes a Well-Known Text (WKT) input string that represents
   * a GEOMETRYCOLLECTION, and converts it into an array of geometry objects
   * (not features at this stage) with identifying characteristics to be
   * transformed into GeoJSON later.
   *
   * @param {string} str - The WKT string for the geometry collection, usually in the form
   *                       'GEOMETRYCOLLECTION(POINT(...), LINESTRING(...), ...)'.
   * @param {string} [label] - An optional label for each geometry parsed, which may be used
   *                           later as a name property in GeoJSON.
   * @returns {Object[]} - An array of geometry objects, each containing:
   *                        - type: the type of geometry (e.g., POINT, LINESTRING).
   *                        - coordinates: numerical array(s) representing the geometry's
   *                          spatial data.
   *
   * The following steps are performed:
   * 1. Setting up parsers: Retrieve the appropriate parsing functions for each
   *    known geometry type, such as POINT or POLYGON, from a predefined map of
   *    methods.
   *
   * 2. Extract geometries: Invoke `extractGeometries` to decompose the WKT string
   *    into its respective geometry components based on delimiters and nesting,
   *    isolating each geometry's WKT sub-string.
   *
   * 3. Parse each geometry: Iterate through the extracted geometries:
   *    - Use regular expressions to identify the type and retrieve the coordinate details.
   *    - Apply the corresponding parser to transform WKT coordinates into numerical arrays.
   *    - Store the result as an object with `type` and `coordinates` attributes.
   *
   * 4. Error Handling: If a geometry type is unsupported or if parsing fails, an
   *    exception is raised to indicate incorrect or unsupported formatting.
   *
   * This function does not wrap the geometries in GeoJSON features but prepares
   * the data in a way that can be easily transformed into GeoJSON format by
   * following processes.
   ****************************************/
  GeoWKTer.prototype.parseGeometryCollection = function (str, label = "") {
    const components = []; // Array to hold parsed geometry objects

    // Map for geometry type to the appropriate parsing function
    const parsers = {
      POINT: this.parsePoint,
      LINESTRING: this.parseLineString,
      POLYGON: this.parsePolygon,
      MULTIPOINT: this.parseMultiPoint,
      MULTILINESTRING: this.parseMultiLineString,
      MULTIPOLYGON: this.parseMultiPolygon,
    };

    // Extract each geometry from the GeometryCollection WKT string
    const geometries = this.extractGeometries(str);

    // Process each individual WKT geometry
    geometries.forEach((geometryWKT) => {
      // Match the geometry type and coordinate section
      const match = geometryWKT.match(/([A-Z]+)\s*\((.*)\)/i);
      if (match) {
        const type = match[1].toUpperCase(); // Capture geometry type
        const parser = parsers[type]; // Get parser for this geometry type
        if (parser) {
          // Parse coordinates using the relevant parser function
          const coordinates = parser.call(this, match[2].trim());
          components.push({
            type: type, // Store geometry type
            coordinates: coordinates, // Store parsed coordinates
          });
        } else {
          // Raise error if unsupported geometry type is encountered
          throw new Error(`Unsupported geometry type: ${type}`);
        }
      } else {
        // Raise error if WKT parsing fails
        throw new Error("Failed to parse geometry WKT");
      }
    });

    return components; // Return the array of parsed geometry objects
  };

  // Instantiate the TEST
  /*
  const testCases = [
    "POINT (-72.7000 41.5000)",
    `LINESTRING (
      -72.9300 41.3100,
      -72.7800 41.6700,
      -72.6500 41.9100
    )`,
    `POLYGON ((
      -73.4860 42.0520,
      -73.7040 40.9860,
      -72.0540 41.0610,
      -71.7980 42.0390,
      -73.4860 42.0520
    ))`,
    `MULTIPOINT (
      (-72.9279 41.3083),
      (-72.6734 41.7658),
      (-72.7420 41.7621)
    )`,
    `MULTIPOINT (
      -72.9279 41.3083,
      -72.6734 41.7658,
      -72.7420 41.7621
    )`,
    `MULTILINESTRING (
      (
        -72.3500 41.4500,
        -72.8500 41.7500
      ),
      (
        -73.4500 41.3000,
        -72.9500 41.8500
      )
    )`,
    `MULTIPOLYGON (
      (
        (
          -73.1000 41.9000,
          -72.9000 41.8000,
          -73.0000 41.9000,
          -73.1000 41.9000
        )
      ),
      (
        (
          -72.8000 41.5000,
          -72.8000 41.6000,
          -72.7000 41.6000,
          -72.7000 41.5000,
          -72.8000 41.5000
        )
      )
    )`,
    `GEOMETRYCOLLECTION (
      POINT (-72.6734 41.7658),
      LINESTRING (
        -72.3000 41.3000,
        -72.8000 41.5000
      ),
      POLYGON ((
        -73.4860 42.0520,
        -73.7040 40.9860,
        -72.0540 41.0610,
        -71.7980 42.0390,
        -73.4860 42.0520
      ))
    )`,
  ];

  const geoWKT = new GeoWKTer();
  testCases.forEach((testCase, index) => {
    try {
      // Clean the WKT string
      const cleanedWKT = geoWKT.cleanWKTString(testCase);

      // Convert cleaned WKT to internal representation
      const internalRepresentation = geoWKT.read(cleanedWKT, `Sample Label ${index + 1}`);

      // Convert to GeoJSON
      const geoJSON = geoWKT.toGeoJSON(internalRepresentation);

      // Log all information in one console.log statement
      console.log(`Test Case ${index + 1}:\nCleaned WKT: ${cleanedWKT}\nInternal Representation: ${JSON.stringify(internalRepresentation, null, 2)}\nGeoJSON Output: ${JSON.stringify(geoJSON, null, 2)}`);
    } catch (error) {
      console.error(`Error processing WKT for Test Case ${index + 1}:`, error.message);
    }
  });
  */
  
  return GeoWKTer;
})();
