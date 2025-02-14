import React, { ReactElement } from "react";
import useSWR from "swr";
import { CRUD_MODE } from "../../env";
import { SidebarContainer } from "../../document/organisms/sidebar";
import { TOC } from "../../document/organisms/toc";
import { DocParent, Toc } from "../../../../libs/types/document";
import { PageNotFound } from "../../page-not-found";
import { Loading } from "../../ui/atoms/loading";
import { ArticleActionsContainer } from "../../ui/organisms/article-actions-container";

interface StaticPageDoc {
  id: string;
  title: string;
  sections: string[];
  toc: Toc[];
}

interface StaticPageProps {
  extraClasses?: string;
  locale: string;
  slug: string;
  parents: DocParent[];
  fallbackData?: any;
  title?: string;
  sidebarHeader?: ReactElement;
}

function StaticPage({
  extraClasses = "",
  locale,
  slug,
  parents = [],
  fallbackData = undefined,
  title = "MDN",
  sidebarHeader = <></>,
}: StaticPageProps) {
  const baseURL = `/${locale}/${slug}`;
  const featureJSONUrl = `${baseURL}/index.json`;
  const { data: { hyData } = {}, error } = useSWR<{ hyData: StaticPageDoc }>(
    featureJSONUrl,
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status} on ${url}: ${text}`);
      }
      return await response.json();
    },
    {
      fallbackData,
      revalidateOnFocus: CRUD_MODE,
      revalidateOnMount: !fallbackData,
    }
  );

  React.useEffect(() => {
    document.title = hyData ? `${hyData.title} | ${title}` : title;
  }, [hyData, title]);

  if (error) {
    return <PageNotFound />;
  } else if (!hyData) {
    return <Loading />;
  }

  const toc = hyData.toc?.length && <TOC toc={hyData.toc} />;

  return (
    <>
      <ArticleActionsContainer
        parents={[...parents, { uri: baseURL, title: hyData.title }]}
      />

      <div className="main-wrapper">
        <SidebarContainer doc={hyData}>
          {sidebarHeader || null}
        </SidebarContainer>
        <aside className="toc">
          <nav>{toc || null}</nav>
        </aside>
        <main id="content" className="main-content" role="main">
          <article className={`main-page-content ${extraClasses || ""}`}>
            {hyData.sections.map((section, index) => (
              <section
                key={index}
                dangerouslySetInnerHTML={{ __html: section }}
              ></section>
            ))}
          </article>
        </main>
      </div>
    </>
  );
}

export default StaticPage;
