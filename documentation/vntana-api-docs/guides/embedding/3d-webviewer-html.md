# 3D WebViewer HTML Component

> **Source URL:** https://help.vntana.com/3d-webviewer-html-component

## Overview

The VNTANA Viewer is a custom web component that can be placed into your web page as any standard HTML element. This reference summarizes the steps required to implement the HTML element in your website.

## NPM Package

The VNTANA Custom HTML Element is available as an NPM package and code bundle hosted at npmjs.

**Important:** Previous versions (pre-2.1.0) hosted by the `viewer-builds.vntana` domain will remain available but no new versions will be published there. New versions are only provided via the NPM package/code bundle.

## On Premise Solution

The VNTANA 3D Webviewer is typically implemented via loading the viewer script in your page. For environments with no or limited internet access, an "On Premise" solution is available:

- Custom script loaded from internal servers
- Basic project that can be run via tools like `http-server` to serve locally

For more info on On Premise capabilities, contact the VNTANA sales team.

## Basic Usage

Before using the viewer, load the script containing the element definition. ES and UMD modules are available:

```html
<html>
<head>
  <script src="https://viewer-build.vntana.com/v1.0.4/viewer.min.js"></script>
</head>
<body>
  <vntana-viewer src="DamagedHelmet.glb" environment-src="Neutral.hdr">
  </vntana-viewer>
</body>
</html>
```

**Key points:**
- The viewer element can be manipulated and styled anywhere in the DOM like a regular element
- If no attributes are specified, the viewer acts as an empty element
- The closing tag is mandatory even without children

## Attributes and Properties

The viewer can be manipulated by:
1. Setting/removing attributes in HTML or JavaScript
2. Directly through its properties

### Attribute Syntax

All attributes are passed as strings except boolean attributes, which indicate state by presence/absence:

```html
<!-- Set shadow intensity to 0.3 and enable auto-rotation -->
<vntana-viewer shadow-intensity="0.3" enable-auto-rotate></vntana-viewer>
```

**Behavior:**
- Removing an attribute or passing invalid values resets to default
- Removing `shadow-intensity` resets to default value of `0`
- Removing `enable-auto-rotate` sets value to `false`
- Invalid values (e.g., `"something"`) reset to default
- Out-of-bounds values (e.g., `50` for intensity) are clamped (to `1`)

### Property Interface

Properties are more appropriate when viewer parameters change during component lifetime:

```html
<vntana-viewer></vntana-viewer>
<script type="module">
  const viewer = document.querySelector("vntana-viewer");
  viewer.shadowIntensity = 0.3;
  viewer.enableAutoRotate = true;
</script>
```

**Property behavior:**
- Property values are not stored as strings (automatically parsed/converted)
- Attribute values reflect in property values automatically
- Property changes do NOT reflect back to attributes
- Setting `shadow-intensity="0.3"` immediately sets `shadowIntensity` property to `0.3`

## Property Value Types

| Type | Description | Conversion Rules |
|------|-------------|------------------|
| **strings** | Text values | Falsy values become empty string; otherwise `String()` applied |
| **booleans** | True/false | All strings become `true`; otherwise `Boolean()` applied |
| **colors** | Hex colors | `#` followed by six-digit hex code or equivalent number |
| **numbers** | Numeric values | Strings parsed for numbers; invalid values discarded; most have range restrictions; assumed finite unless stated |
| **quantities** | Number-unit pairs | Angles: radians (default), degrees. Distances: meters (default), percentages for relative values |
| **vectors** | Number/quantity combinations | Passed as whitespace-separated strings (e.g., `"30deg -20m 80rad"`) |
| **arrays** | Array values | Passed as stringified JSON to attributes or directly to properties |

### Quantity Examples

```html
<!-- Angle in degrees -->
<vntana-viewer camera-orbit="50deg"></vntana-viewer>

<!-- Distance in meters -->
<vntana-viewer camera-target="10m"></vntana-viewer>

<!-- Values without units use defaults (radians for angles, meters for distances) -->
<vntana-viewer camera-orbit="0.87"></vntana-viewer>
```

## Attribute Reference

For a full list of every possible attribute with types and defaults, refer to the VNTANA Viewer sample repository.

## Sample Implementation

A sample repository is available with implementation examples covering various use cases for the HTML element.

## Related

- [iFrames](./iframes.md)
- [Custom QR Codes](./custom-qr-codes.md)
- [Swagger Reference: Public API](/api-documentation/swagger/vntana-public-api-docs.yaml)
