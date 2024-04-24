const HomePage = () => {
  return (
    <div className="h-full p-4">
      <h1 className="text-3xl">OpenAPI Enhancement Proxy</h1>
      <p>
        See instructions in our{" "}
        <a
          className="text-blue-500"
          href="https://github.com/CodeFromAnywhere/openapi-enhancement-proxy-next"
        >
          GitHub Repo
        </a>
      </p>

      <p>
        Explore all our proxies in our{" "}
        <a className="text-blue-500" href="https://explorer.actionschema.com">
          OpenAPI Explorer
        </a>
      </p>
    </div>
  );
};

export default HomePage;
