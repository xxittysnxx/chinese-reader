import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';

// Configure localforage to use IndexedDB
localforage.config({
  name: 'ChineseReaderDB',
  storeName: 'articles',
  description: 'Stores user articles and their reading progress'
});

const ARTICLES_KEY = 'articles_list';

export const storage = {
  /**
   * Retrieves the list of all saved articles (metadata only)
   */
  async getArticlesList() {
    const list = await localforage.getItem(ARTICLES_KEY);
    return list || [];
  },

  /**
   * Save a new article or update an existing one
   */
  async saveArticle(articleData) {
    const isNew = !articleData.id;
    const article = {
      ...articleData,
      id: articleData.id || uuidv4(),
      updatedAt: Date.now(),
      createdAt: articleData.createdAt || Date.now()
    };

    // Store the full article data individually
    await localforage.setItem(`article_${article.id}`, article);

    // Update the metadata list
    const list = await this.getArticlesList();
    const metadata = {
      id: article.id,
      title: article.title || '未命名文章',
      updatedAt: article.updatedAt,
      createdAt: article.createdAt,
      snippet: article.rawHtml ? article.rawHtml.substring(0, 100).replace(/<[^>]+>/g, '') : ''
    };

    if (isNew) {
      list.push(metadata);
    } else {
      const index = list.findIndex(item => item.id === article.id);
      if (index > -1) {
        list[index] = metadata;
      }
    }
    
    // Sort by recently updated
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    await localforage.setItem(ARTICLES_KEY, list);
    
    return article.id;
  },

  /**
   * Retrieves a specific article with full content
   */
  async getArticle(id) {
    return await localforage.getItem(`article_${id}`);
  },

  /**
   * Deletes an article
   */
  async deleteArticle(id) {
    await localforage.removeItem(`article_${id}`);
    let list = await this.getArticlesList();
    list = list.filter(item => item.id !== id);
    await localforage.setItem(ARTICLES_KEY, list);
  }
};
