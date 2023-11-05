export default ({ appName, token, handleSetPage, tab, store }) => {
  return (
    <div class="home-page">
      <div class="banner">
        <div class="container">
          <h1 class="logo-font" textContent={appName} />
          <p>A place to share your knowledge.</p>
        </div>
      </div>

      <div class="container page">
        <div class="row">
          <div class="col-md-9">
            <div class="feed-toggle">
              <ul class="nav nav-pills outline-active">
                {token && (
                  <li class="nav-item">
                  </li>
                )}
                <li class="nav-item">
                </li>
                <Show when={tab() !== "all" && tab() !== "feed"}>
                  <li class="nav-item">
                    <a href="" class="nav-link active">
                      <i class="ion-pound" /> {tab()}
                    </a>
                  </li>
                </Show>
              </ul>
            </div>

          </div>

          <div class="col-md-3">
            <div class="sidebar">
              <p>Popular Tags</p>
              <Suspense fallback="Loading tags...">
                <div class="tag-list">
                  <For each={store.tags}>
                    {tag => (
                      <a href={`#/?tab=${tag}`} class="tag-pill tag-default">
                        {tag}
                      </a>
                    )}
                  </For>
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
