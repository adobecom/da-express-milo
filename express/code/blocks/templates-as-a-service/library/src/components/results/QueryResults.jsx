import { useState } from 'react';
import { fetchResults } from '../../../../../../scripts/template-utils.js';
import { useFormData } from '../../utils/form-hooks.js';
import { form2Recipe } from '../../utils/recipe-form-utils.js';
import Template from './Template.jsx';

function Button({ generateResults, loading, results }) {
  return (
    <button onClick={generateResults} disabled={loading}>
      {loading ? 'Generating...' : results ? 'Regenerate' : 'Generate'}
    </button>
  );
}

export default function QueryResults() {
  const formData = useFormData();
  const recipe = form2Recipe(formData);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateResults = async () => {
    setResults(null);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResults(recipe);
      setResults(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-grey rounded p-1 gap-1">
      <h2>Results</h2>
      <Button
        generateResults={generateResults}
        loading={loading}
        results={results}
      />
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error.message}</p>}
      {results?.metadata?.totalHits > 0 && (
        <p>Total hits: {results.metadata.totalHits}</p>
      )}
      {results?.metadata?.totalHits === 0 && (
        <p>No results found. Try different recipe.</p>
      )}
      {results?.items?.length > 0 && (
        <div className="flex flex-wrap gap-2 row-gap-7 templates">
          {results.items.map((item) => (
            <Template key={item.id} template={item} />
          ))}
        </div>
      )}
    </div>
  );
}
