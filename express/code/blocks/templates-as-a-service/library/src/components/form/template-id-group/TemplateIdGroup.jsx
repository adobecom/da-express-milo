import { useRef, useEffect } from 'react';
import {
  ACTION_TYPES,
  useFormData,
  useFormDispatch,
} from '../../../utils/form-hooks';
import Label from '../Label';
import InfoButton from '../fields/InfoButton';

function Row({ rowIndex, templateId, expandButton, inputRef }) {
  const formDispatch = useFormDispatch();
  return (
    <Label>
      <input
        ref={inputRef}
        className="template-id-input"
        type="text"
        value={templateId}
        name={`template-manual-id-${rowIndex}`}
        onChange={(e) =>
          formDispatch({
            type: ACTION_TYPES.IDS_UPDATE,
            payload: {
              idsRow: rowIndex,
              value: e.target.value,
            },
          })
        }
      />
      <div className="flex gap-1">
        {rowIndex === 0 || (
          <button
            onClick={(e) => {
              e.preventDefault();
              formDispatch({
                type: ACTION_TYPES.IDS_REMOVE,
                payload: {
                  idsRow: rowIndex,
                },
              });
            }}
          >
            -
          </button>
        )}
        {expandButton}
      </div>
      <InfoButton fieldName={'template-id'} content={'Having manual ids will ignore all filters and boosting. Collection is still needed. Limit can be used in combo with backup recipe. Clicking each Template Result can toggle the display of its id.'} />
    </Label>
  );
}

export const MAX_INDIVIDUAL_IDS = 8;

export default function TemplateIdGroups() {
  const formData = useFormData();
  const formDispatch = useFormDispatch();
  const { templateIds } = formData;
  const inputRefs = useRef([]);
  const prevLength = useRef(templateIds.length);

  // Focus on the newest input when a new one is added
  useEffect(() => {
    if (templateIds.length > prevLength.current) {
      const lastInputIndex = templateIds.length - 1;
      if (inputRefs.current[lastInputIndex]) {
        inputRefs.current[lastInputIndex].focus();
      }
    }
    prevLength.current = templateIds.length;
  }, [templateIds.length]);

  const expandButton = (
    <button
      onClick={(e) => {
        e.preventDefault();
        formDispatch({
          type: ACTION_TYPES.IDS_ADD,
        });
      }}
    >
      ADD ID
    </button>
  );
  return (
    <div className="flex flex-col items-start">
      {templateIds.map((templateId, i) => (
        <Row
          key={i}
          rowIndex={i}
          templateId={templateId}
          expandButton={(i === templateIds.length - 1 && templateIds.length < MAX_INDIVIDUAL_IDS) ? expandButton : null}
          inputRef={(el) => (inputRefs.current[i] = el)}
        />
      ))}
    </div>
  );
}
