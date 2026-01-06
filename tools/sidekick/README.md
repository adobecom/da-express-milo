# Notes on the sidekick / DA library

The DA config controls the tools in the DA library for this site, not the sidekick/config.json .

## Editing the DA Library
To edit the DA library tools, go to https://da.live/config#/adobecom/da-bacom/ and edit the "library" sheet. 

### Ref
You can test your changes by setting a ref. If there's no ref listed, the tool will be live in the library.

Example:

```
// da-bacom config sheet
ref: methomas-tag-browser

// Test page with ?ref=methomas-tag-browser
https://da.live/edit?ref=methomas-tag-browser#/adobecom/da-bacom/drafts/methomas/brand-concierge
```

This will pull code from `https://methomas-tag-browser--da-bacom--adobecom.aem.live` so make sure your ref is your branch name if you have corresponding code changes.
