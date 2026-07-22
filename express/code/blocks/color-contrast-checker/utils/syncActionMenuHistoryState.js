export function getActionMenuHistoryDetail(historyService) {
  const { past, future } = historyService.getSize();
  const hasCurrent = historyService.getCurrent() !== null;

  return {
    historyIndex: hasCurrent ? past : 0,
    historyLength: hasCurrent ? past + future + 1 : 0,
  };
}

export default function syncActionMenuHistoryState(
  actionMenuIds,
  historyService,
  eventTarget = document,
) {
  const detail = getActionMenuHistoryDetail(historyService);

  actionMenuIds.filter(Boolean).forEach((id) => {
    eventTarget.dispatchEvent(new CustomEvent(`${id}:history-index-changed`, {
      detail,
      bubbles: true,
      composed: true,
    }));
  });

  return detail;
}
