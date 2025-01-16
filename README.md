# GeoWKTer

GeoWKTer is a JavaScript utility for converting Well-Known Text (WKT) into GeoJSON format. This tool is essential for web mapping applications where geographic data transformation and visualization are required.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [.read() Method](#read-method)
- [.toGeoJSON() Method](#togeojson-method)
- [Example Workflow](#example-workflow)
- [License](#license)

## Overview

The `GeoWKTer` class provides key functionality to transform WKT representations into GeoJSON objects. It comprises methods that facilitate this conversion, primarily through its `.read()` and `.toGeoJSON()` methods.

## Installation

To use `GeoWKTer`, include it in your JavaScript project.

## Usage

### .read() Method

- **Purpose**: Parses the input WKT string and converts it into an internal geometric representation.
- **Inputs**:
  - `wktText`: A string with one or more WKT geometry definitions, separated by newlines if multiple.
  - `label` (optional): A label for the parsed features, with a default value `'Unnamed'` if unspecified.
- **Process**:
  - Splits and cleans the WKT string into individual lines for parsing.
  - Identifies each geometric entity by its type (e.g., Point, Polygon) using a regular expression.
  - Constructs an internal representation through handlers specific to geometry types, which are stored in the `features` array. Each entry represents a GeoJSON structure with type, coordinates, and properties.

### .toGeoJSON() Method

- **Purpose**: Converts the internal representation into a GeoJSON object compatible with various applications.
- **Inputs**: None.
- **Output**: Returns a GeoJSON `FeatureCollection` object.
- **Process**:
  - Compiles features from the `features` array into a single `FeatureCollection`.
  - Ensures each feature is structured according to the GeoJSON format, facilitated by the initial parsing via `.read()`.

## Example Workflow

```javascript
// Example WKT string
const wktString = 'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))';

// Convert WKT to GeoJSON
const geoWKTer = new GeoWKTer();
geoWKTer.read(wktString , label );
const geoJsonData = geoWKTer.toGeoJSON();

console.log(geoJsonData);

{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [30, 10],
            [40, 40],
            [20, 40],
            [10, 20],
            [30, 10]
          ]
        ]
      },
      "properties": {
        "Name": "label" // Optional label string if provided
      }
    }
  ]
}
```
## License
This project is licensed under the MIT License. See the LICENSE file for further details.
