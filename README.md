# Next Openapi Proxy

This repo can be used as a template. It makes a proxy for multiple APIs in a serverless environment. To use it, put your OpenAPI JSON inside of public with name `[name].json`. Your API will now be accessible at `[name].[domain].tld`.

- put `openapi.json` in `/public`

Motivation: Be able to provide OpenAPI based tools, testing, and other benefits.

# How to obtain an OpenAPI from a SaaS website

- We can scrape all subdomains of the site domain and try common openapi locations, e.g. `/openapi.json` or `/openapi.yaml` or `/swagger.json`
- As stated [here](https://stackoverflow.com/questions/41660658/openapi-or-swagger-json-auto-discovery) we could first figure out the api server, then check `/api-docs`
- Look at `/.well-known/schema-discovery` (as in https://github.com/zalando/restful-api-guidelines/pull/277/files)
- Request OPTIONS at `/` of the API address (see https://www.rfc-editor.org/rfc/rfc7231#section-4.3.7)
- We can find it by searching google for `site:[domain] "openapi"`
- If we can find a swaggersite but the spec isn't available as JSON, you can still find it in sources of swagger.
- In some other docs generators it's also available in sources.
- It might be available on github or anywhere else publicly hosted. try things like `site:github.com "[sitename]" "openapi"`
- If it's not available publicly but there are docs that are obviously created using an OpenAPI spec (such as from readme.com) we can email the developer or contact the SaaS, asking for the spec.
- Some other people already explored them by scraping:
  - Google BigQuery
  - SwaggerHub API
  - APIS.Guru api: https://api.apis.guru/v2/list.json
