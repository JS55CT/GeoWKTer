# GeoWKTer: WKT to GeoJSON Converter

GeoWKTer is a JavaScript library designed to convert Well-Known Text (WKT) representations of geometries into GeoJSON format. This tool is useful for developers and GIS specialists who need to work with geographic data across different standards.

## Features

- Supports conversion of various WKT geometry types including POINT, LINESTRING, POLYGON, MULTIPOINT, MULTILINESTRING, MULTIPOLYGON, and GEOMETRYCOLLECTION.
- Handles multi-line WKT inputs.
- Provides a streamlined API for converting WKT to GeoJSON FeatureCollections.

## Usage

Here's a basic example of how to use the GeoWKTer library:

```javascript
// Initialize the GeoWKTer instance
let geoWKTer = new GeoWKTer();

// Example WKT input
let wktText = `
GEOMETRYCOLLECTION(POINT(4 6), LINESTRING(4 6, 7 10))
GEOMETRYCOLLECTION(POLYGON((8 4, 11 4, 9 7, 8 4)))
`;

// Convert WKT to GeoJSON
let wktDataArray = geoWKTer.read(wktText, 'Example Label');
let geoJsonData = geoWKTer.toGeoJSON(wktDataArray);

// Output GeoJSON
console.log(JSON.stringify(geoJsonData, null, 2));
```

## API

### GeoWKTer

- **read(wktText, label):** Parses a WKT string and returns an array of geometry objects. It splits multi-line WKT text and labels each geometry.

- **toGeoJSON(dataArray):** Converts the parsed WKT data array into a GeoJSON `FeatureCollection`.

## License

GeoWKTer is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for more details.

## Acknowledgments

GeoWKTer was derived from and inspired by the work of [Wicket](https://github.com/arthur-e/Wicket), authored by K. Arthur Endsley at the Michigan Tech Research Institute (MTRI). Wicket is shared under the terms of the GNU General Public License. We extend our gratitude for this foundational work. For more information on the original project, please refer to the [Wicket repository](https://github.com/arthur-e/Wicket).

Inspired by the need to bridge WKT with GeoJSON for versatile geographic data transformations.
