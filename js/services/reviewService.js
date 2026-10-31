/**
 * ANILyfe Review & Question Service
 * Handles marketplace customer reviews and product inquiries.
 * Strict marketplace behavior: No social discussions or feeds.
 */
(function() {
  const REVIEWS_KEY = 'anilyfe_seller_reviews';
  const QUESTIONS_KEY = 'anilyfe_seller_questions';

  function defaultReviews() { return []; }

  function defaultQuestions() { return []; }

  function getStoredReviews() {
    try {
      const raw = localStorage.getItem(REVIEWS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultReviews();
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(def));
    return def;
  }

  function getStoredQuestions() {
    try {
      const raw = localStorage.getItem(QUESTIONS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const def = defaultQuestions();
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(def));
    return def;
  }

  const reviewService = {
    async getReviews(filter = 'All') {
      await new Promise(r => setTimeout(r, 40));
      let list = getStoredReviews();

      if (filter === '5 stars') list = list.filter(r => r.rating === 5);
      else if (filter === '4 stars') list = list.filter(r => r.rating === 4);
      else if (filter === '3 stars') list = list.filter(r => r.rating === 3);
      else if (filter === '2 stars') list = list.filter(r => r.rating === 2);
      else if (filter === '1 star') list = list.filter(r => r.rating === 1);
      else if (filter === 'Unanswered') list = list.filter(r => !r.answered);
      else if (filter === 'Verified purchases') list = list.filter(r => r.verifiedPurchase);
      else if (filter === 'Reviews with photos') list = list.filter(r => r.photos && r.photos.length > 0);

      return list;
    },

    async replyToReview(reviewId, replyText) {
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredReviews();
      const rev = list.find(r => r.id === reviewId);
      if (!rev) throw new Error('Review not found');

      rev.sellerResponse = replyText.trim();
      rev.answered = true;
      localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('anilyfe:reviews-updated'));
      return rev;
    },

    async reportReview(reviewId, reason = 'Inappropriate content') {
      await new Promise(r => setTimeout(r, 50));
      const list = getStoredReviews();
      const rev = list.find(r => r.id === reviewId);
      if (rev) {
        rev.reported = true;
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
      }
      return true;
    },

    async getQuestions(filter = 'All') {
      await new Promise(r => setTimeout(r, 40));
      let list = getStoredQuestions();

      if (filter === 'Unanswered') list = list.filter(q => !q.answered);
      else if (filter === 'Answered') list = list.filter(q => q.answered);

      return list;
    },

    async answerQuestion(questionId, answerText) {
      await new Promise(r => setTimeout(r, 60));
      const list = getStoredQuestions();
      const qst = list.find(q => q.id === questionId);
      if (!qst) throw new Error('Question not found');

      qst.answerText = answerText.trim();
      qst.answered = true;
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('anilyfe:questions-updated'));
      return qst;
    }
  };

  window.reviewService = reviewService;
})();
