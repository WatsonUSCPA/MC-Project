import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecipeIndex, RecipeSummary, relatedRecipes, sortNew, sortPopular } from '../recipesApi';
import './RecipeStrip.css';

interface RecipeStripProps {
  title: string;
  subtitle?: string;
  /** 'new' | 'popular' | 'related'（related は relatedText のキーワードで関連レシピ） */
  mode: 'new' | 'popular' | 'related';
  relatedText?: string;
  limit?: number;
  excludeId?: string;
  moreLink?: string;
}

export const RecipeCardMini: React.FC<{ recipe: RecipeSummary }> = ({ recipe }) => (
  <Link to={`/gallery/detail/${recipe.id}`} className="rs-card">
    <div className="rs-card-image">
      <img src={recipe.thumb} alt={recipe.title} loading="lazy" decoding="async" width={480} height={270} />
    </div>
    <div className="rs-card-body">
      <span className={`rs-partner rs-partner-${recipe.partnerId}`}>{recipe.partnerName}</span>
      <h3 className="rs-card-title">{recipe.title}</h3>
      {recipe.difficulty && <span className="rs-meta">難易度: {recipe.difficulty}</span>}
    </div>
  </Link>
);

// ショップ各ページに置く「クラフトキッチンのレシピ」帯
const RecipeStrip: React.FC<RecipeStripProps> = ({ title, subtitle, mode, relatedText = '', limit = 4, excludeId, moreLink = '/gallery' }) => {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetchRecipeIndex()
      .then(({ recipes: all }) => {
        if (!alive) return;
        const list = mode === 'new' ? sortNew(all).filter((r) => r.id !== excludeId).slice(0, limit)
          : mode === 'popular' ? sortPopular(all).filter((r) => r.id !== excludeId).slice(0, limit)
          : relatedRecipes(all, relatedText, limit, excludeId);
        setRecipes(list);
      })
      .catch(() => alive && setRecipes([]));
    return () => { alive = false; };
  }, [mode, relatedText, limit, excludeId]);

  if (recipes && recipes.length === 0) return null;

  return (
    <section className="recipe-strip" aria-label={title}>
      <div className="rs-header">
        <div>
          <h2 className="rs-title">📖 {title}</h2>
          {subtitle && <p className="rs-subtitle">{subtitle}</p>}
        </div>
        <Link to={moreLink} className="rs-more">クラフトキッチンで見る →</Link>
      </div>
      <div className="rs-grid">
        {recipes
          ? recipes.map((r) => <RecipeCardMini key={r.id} recipe={r} />)
          : Array.from({ length: limit }).map((_, i) => <div key={i} className="rs-card rs-skeleton" />)}
      </div>
    </section>
  );
};

export default RecipeStrip;
