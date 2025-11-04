
import React from 'react';
import type { Article } from '../types';

interface ResultsTableProps {
  articles: Article[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ articles }) => {
  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-800/50 rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-100 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                标题 (Title)
              </th>
              <th scope="col" className="px-6 py-3 hidden md:table-cell">
                作者 (Author)
              </th>
              <th scope="col" className="px-6 py-3">
                日期 (Date)
              </th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article, index) => (
              <tr
                key={`${article.title}-${index}`}
                className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
              >
                <td className="px-6 py-4 font-medium text-white">
                  {article.title}
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  {article.author || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {article.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
