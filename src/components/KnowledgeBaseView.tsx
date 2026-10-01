import React, { useState, useMemo } from 'react';
import { KnowledgeArticle } from '../types';
import { KNOWLEDGE_ARTICLES } from '../mockData';
import {
  Search,
  BookOpen,
  Eye,
  ThumbsUp,
  Tag,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Plus,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  onOpenNewTicket: () => void;
  selectedArticleId?: string | null;
  onClearSelectedArticle?: () => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  onOpenNewTicket,
  selectedArticleId,
  onClearSelectedArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(
    selectedArticleId || null
  );
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, boolean>>({});

  const categories = useMemo(() => {
    const set = new Set<string>();
    KNOWLEDGE_ARTICLES.forEach((a) => set.add(a.category));
    return Array.from(set);
  }, []);

  const filteredArticles = useMemo(() => {
    return KNOWLEDGE_ARTICLES.filter((art) => {
      if (selectedCategory !== 'all' && art.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesSummary = art.summary.toLowerCase().includes(q);
        const matchesTags = art.tags.some((t) => t.toLowerCase().includes(q));
        const matchesContent = art.content.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesTags || matchesContent;
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const activeArticle = useMemo(() => {
    return KNOWLEDGE_ARTICLES.find((a) => a.id === activeArticleId) || null;
  }, [activeArticleId]);

  const handleVote = (articleId: string) => {
    setHelpfulFeedback((prev) => ({ ...prev, [articleId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">
            Base de Conhecimento & Autoatendimento
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Artigos, tutoriais técnicos e procedimentos para soluções imediatas sem fila de espera.
          </p>
        </div>
        <button
          onClick={onOpenNewTicket}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Não encontrou? Abra um Chamado</span>
        </button>
      </div>

      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por tutoriais, VPN, senhas, ERP, impressoras, procedimentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-neutral-100 rounded-lg">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Articles list + Detail Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Articles cards list */}
        <div className={`${activeArticle ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-3`}>
          {filteredArticles.length === 0 ? (
            <div className="p-8 border border-neutral-200 rounded-lg text-center bg-white space-y-2">
              <HelpCircle className="w-8 h-8 text-neutral-300 mx-auto" />
              <p className="text-sm font-semibold text-neutral-700">Nenhum artigo encontrado</p>
              <p className="text-xs text-neutral-500">
                Tente outros termos de busca ou abra um chamado diretamente com o suporte.
              </p>
              <button
                onClick={onOpenNewTicket}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded text-xs font-medium"
              >
                Abrir Chamado Agora
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => {
              const isSelected = activeArticleId === article.id;
              return (
                <div
                  key={article.id}
                  onClick={() => setActiveArticleId(article.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all bg-white hover:border-neutral-400 ${
                    isSelected ? 'ring-2 ring-neutral-900 border-neutral-900' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
                    <span>{article.category}</span>
                    <span className="font-mono">Atualizado em {article.updatedAt}</span>
                  </div>

                  <h3 className="text-sm font-semibold text-neutral-900 leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-2 mt-1.5 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span className="font-mono tabular-nums">{article.views}</span>
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="font-mono tabular-nums">{article.helpfulCount}</span>
                      </span>
                    </div>

                    <span className="text-neutral-700 font-medium flex items-center gap-1 hover:text-neutral-900">
                      <span>Ler guia</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Article Content Viewer */}
        {activeArticle && (
          <div className="lg:col-span-2 border border-neutral-200 rounded-lg bg-white p-6 space-y-6">
            <div className="border-b border-neutral-200 pb-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>{activeArticle.category}</span>
                <span className="font-mono">Ref: {activeArticle.id.toUpperCase()}</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900">{activeArticle.title}</h2>
              <p className="text-xs text-neutral-600 italic">{activeArticle.summary}</p>
            </div>

            {/* Content Body */}
            <div className="text-xs text-neutral-800 leading-relaxed whitespace-pre-line bg-neutral-50/60 p-4 rounded-lg border border-neutral-200 font-mono">
              {activeArticle.content}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-neutral-500 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags:
              </span>
              {activeArticle.tags.map((tag) => (
                <span key={tag} className="text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Feedback section */}
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-neutral-800">Este guia resolveu o seu problema?</p>
                <p className="text-[11px] text-neutral-500">
                  Sua avaliação ajuda a melhorar a assertividade da central.
                </p>
              </div>

              {helpfulFeedback[activeArticle.id] ? (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Obrigado pelo seu feedback!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(activeArticle.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Sim, ajudou</span>
                  </button>
                  <button
                    onClick={onOpenNewTicket}
                    className="px-3 py-1.5 bg-neutral-200 text-neutral-800 rounded text-xs font-medium hover:bg-neutral-300 transition-colors"
                  >
                    Não, preciso de técnico
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
