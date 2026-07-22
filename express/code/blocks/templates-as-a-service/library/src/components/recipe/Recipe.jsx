import { useState } from 'react';
import { recipe2ApiQuery } from '../../../../../../scripts/template-utils.js';
import { form2Recipe } from '../../utils/recipe-form-utils';
import {
  useFormData,
  useFormDispatch,
  ACTION_TYPES,
} from '../../utils/form-hooks';

export default function Recipe() {
  const [showCopied, setShowCopied] = useState(false);
  const formData = useFormData();
  const recipe = form2Recipe(formData);
  const { url } = recipe2ApiQuery(recipe);
  const query = new URL(url).search.slice(1);
  const formDispatch = useFormDispatch();

  const copyRecipe = () => {
    navigator.clipboard.writeText(query);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <div className="border-grey rounded p-1">
      <h2>Recipe to Form:</h2>
      <textarea
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        value={query}
        onChange={(e) =>
          formDispatch({
            type: ACTION_TYPES.UPDATE_RECIPE,
            payload: { value: e.target.value },
          })
        }
      />
      <div className="copy-button-container flex items-center justify-between">
        <button onClick={copyRecipe}>Copy</button>
        {showCopied && <p className="copied">Copied to clipboard!</p>}
      </div>
    </div>
  );
}
