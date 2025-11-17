
import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="text-center p-4 md:p-6 border-b border-gray-700">
      <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
        申报 '志怪异事' AI 筛选器
      </h1>
      <p className="mt-2 text-md md:text-lg text-gray-400 max-w-3xl mx-auto">
        使用 Gemini API 分析《申报》所有篇目，筛选出与“志怪”（超自然故事）和“异事”（奇特事件）相关的文章。
      </p>
    </div>
  );
};

export default Header;
