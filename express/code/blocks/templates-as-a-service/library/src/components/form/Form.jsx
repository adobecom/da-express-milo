import { useCallback } from 'react';
import {
  ACTION_TYPES,
  useFormData,
  useFormDispatch,
} from '../../utils/form-hooks';
import TopicsGroups from './topics/TopicsGroups';
import TextField from './fields/TextField';
import SelectField from './fields/SelectField';
import NumberField from './fields/NumberField';
import TextArea from './fields/TextArea';
import TemplateIdGroups, { MAX_INDIVIDUAL_IDS } from './template-id-group/TemplateIDGroup';

export default function Form() {
  const formData = useFormData();
  const formDispatch = useFormDispatch();
  const createFieldChangeHandler = useCallback(
    (fieldName, isNum = false) =>
    ({ target: { value } }) => {
      formDispatch({
        type: ACTION_TYPES.UPDATE_FORM,
        payload: { field: fieldName, value: isNum ? Number(value) : value },
      });
    },
    [formDispatch]
  );
  return (
    <form className="border-grey rounded p-1 gap-1">
      <h2>Form to Recipe:</h2>
      <h4>Search Parameters</h4>

      <TextField
        label="Q:"
        name="q"
        value={formData.q}
        onChange={createFieldChangeHandler('q')}
        info="Search query. This is more flexible and ambiguous than using filters but also less precise."
      />

      <SelectField
        label="Collection:"
        name="collection"
        value={formData.collection}
        onChange={createFieldChangeHandler('collection')}
        options={[
          { value: 'default', label: 'Default' },
          { value: 'popular', label: 'Popular' },
          { value: 'custom', label: 'Use Custom collection ID' },
        ]}
        info="Predefined collections. Select Customized to use specific Collection ID. Defaults to the global collection (urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418). You can also use the Popular collection (urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852)."
      />

      <TextField
        label="Collection ID:"
        name="collectionId"
        value={formData.collectionId}
        onChange={createFieldChangeHandler('collectionId')}
        title="Optional. Defaults to the global collection (urn:aaid:sc:VA6C2:25a82757-01de-4dd9-b0ee-bde51dd3b418). Another common is the popular collection (urn:aaid:sc:VA6C2:a6767752-9c76-493e-a9e8-49b54b3b9852)."
        disabled={formData.collection !== 'custom'}
        required={formData.collection === 'custom'}
      />

      {formData.collection === 'custom' && !formData.collectionId && (
        <div className="error-message">
          Collection ID is required when using a custom collection
        </div>
      )}

      <NumberField
        label="Limit:"
        name="limit"
        value={formData.limit}
        onChange={createFieldChangeHandler('limit', true)}
        info="Number of results to return"
      />

      <NumberField
        label="Start:"
        name="start"
        value={formData.start}
        onChange={createFieldChangeHandler('start', true)}
        info="Starting index for the results"
      />

      <SelectField
        label="Order by:"
        name="orderBy"
        value={formData.orderBy}
        onChange={createFieldChangeHandler('orderBy')}
        options={[
          { value: '', label: 'Relevancy (Default)' },
          { value: '-remixCount', label: 'Descending Remix Count' },
          { value: '+remixCount', label: 'Ascending Remix Count' },
          {
            value: '-createDate',
            label: 'Descending Create Date (New first)',
          },
          {
            value: '+createDate',
            label: 'Ascending Create Date (Old first)',
          },
        ]}
        info="Select by which method results would be ordered"
      />

      <h4>Filters (comma separated):</h4>

      <TextField
        label="Language:"
        name="language"
        value={formData.language}
        onChange={createFieldChangeHandler('language')}
        info="Available values : ar-SA, bn-IN, cs-CZ, da-DK, de-DE, el-GR, en-US, es-ES, fil-P,fi-FI, fr-FR,hi-IN, id-ID, it-IT, ja-JP, ko-KR, ms-MY, nb-NO, nl-NL, pl-PL, pt-BR, ro-RO, ru-RU, sv-SE, ta-IN, th-TH, tr-TR, uk-UA, vi-VN, zh-Hans-CN, zh-Hant-TW"
      />

      <TextField
        label="Tasks:"
        name="tasks"
        value={formData.tasks}
        onChange={createFieldChangeHandler('tasks')}
      />

      <TopicsGroups />

      <SelectField
        label="Behaviors:"
        name="behaviors"
        value={formData.behaviors}
        onChange={createFieldChangeHandler('behaviors')}
        options={[
          { value: '', label: 'All (Default)' },
          { value: 'still', label: 'Still' },
          { value: 'animated', label: 'Animated' },
          { value: 'video', label: 'Video' },
          { value: 'animated,video', label: 'Animated + Video' },
        ]}
      />

      <SelectField
        label="Licensing Category:"
        name="license"
        value={formData.license}
        onChange={createFieldChangeHandler('license')}
        options={[
          { value: '', label: 'All (Default)' },
          { value: 'free', label: 'Free' },
          { value: 'premium', label: 'Premium' },
        ]}
        info="Premium/Crown icon will be added to Template Results for premium templates"
      />

      <h4>Manual Template IDs (Max {MAX_INDIVIDUAL_IDS})</h4>
      <TemplateIdGroups />

      <h4>Boosting:</h4>

      <TextField
        label="Preferred Language Boosting:"
        name="prefLang"
        value={formData.prefLang}
        onChange={createFieldChangeHandler('prefLang')}
        info="Boost templates that are in this language. Useful when your results have a mix of languages. Same list as the one for language filter."
      />

      <TextField
        label="Preferred Region Boosting:"
        name="prefRegion"
        value={formData.prefRegion}
        onChange={createFieldChangeHandler('prefRegion')}
        info="Available values :  AD, AE, AF, AG, AI, AL, AM, AN, AO, AQ, AR, AS, AT, AU, AW, AX, AZ, BA, BB, BD, BE, BF, BG, BH, BI, BJ, BL, BM, BN, BO, BR, BS, BT, BV, BW, BY, BZ, CA, CC, CD, CF, CG, CH, CI, CK, CL, CM, CN, CO, CR, CU, CV, CX, CY, CZ, DE, DJ, DK, DM, DO, DZ, EC, EE, EG, EH, ER, ES, ET, FI, FJ, FK, FM, FO, FR, GA, GB, GD, GE, GF, GG, GH, GI, GL, GM, GN, GP, GQ, GR, GS, GT, GU, GW, GY, HK, HM, HN, HR, HT, HU, ID, IE, IL, IM, IN, IO, IQ, IR, IS, IT, JE, JM, JO, JP, KE, KG, KH, KI, KM, KN, KR, KV, KW, KY, KZ, LA, LB, LC, LI, LK, LR, LS, LT, LU, LV, LY, MA, MC, MD, ME, MF, MG, MH, MK, ML, MM, MN, MO, MP, MQ, MR, MS, MT, MU, MV, MW, MX, MY, MZ, NA, NC, NE, NF, NG, NI, NL, NO, NP, NR, NU, NZ, OM, PA, PE, PF, PG, PH, PK, PL, PM, PN, PR, PS, PT, PW, PY, QA, RE, RO, RS, RU, RW, SA, SB, SC, SD, SE, SG, SH, SI, SJ, SK, SL, SM, SN, SO, SR, ST, SV, SY, SZ, TC, TD, TF, TG, TH, TJ, TK, TL, TM, TN, TO, TR, TT, TV, TW, TZ, UA, UG, UM, US, UY, UZ, VA, VC, VE, VG, VI, VN, VU, WF, WS, YE, YT, ZA, ZM, ZW, ZZ"
      />

      <h4>Backup Recipe:</h4>
      <TextArea
        name="backupRecipe"
        value={formData.backupRecipe}
        onChange={createFieldChangeHandler('backupRecipe')}
        label={
          "When not enough templates exist for the recipe's limit, templates from this backup recipe will be used to backfill. Note: start will stop functioning, and this setup should only be used for 1-page query (no toolbar and pagination)."
        }
      />
    </form>
  );
}
