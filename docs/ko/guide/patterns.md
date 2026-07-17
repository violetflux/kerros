# 패턴

## Provider props로 초기화하기

`children`을 제외한 Provider props가 Store Hook에 전달됩니다.

```tsx
const [useDocument, DocumentProvider] = createStore(
  ({ documentId }: { documentId: string }) => {
    const document = useDocumentQuery(documentId)
    return { documentId, document }
  },
)
```

props가 바뀌면 Hook이 평소처럼 다시 실행되고 커밋된 스냅샷이 구독자에게 게시됩니다.

## SDK Hook은 한 번만 호출하기

연결이나 cache를 소유한 SDK Hook은 하나의 Store에서만 호출하고 필요한 필드를 투영합니다.

```tsx
function useStreamStore() {
  const stream = useSdkStream()
  return {
    messages: stream.messages,
    status: stream.status,
    send: stream.send,
  }
}

export const [useStream, StreamProvider] = createStore(useStreamStore)
```

다른 Store에서 SDK Hook을 다시 호출하지 말고 `useStream`에서 선택하세요. 연결과 cache가 하나로 유지됩니다.

## 큰 Store 나누기

파일 크기가 아니라 소유권, 수명, 업데이트 빈도로 나눕니다. 연결, UI 투영, navigation, draft는 서로 다른 Store가 될 수 있습니다.

```text
Stream → Thread → Sender
   ↑         Navigation
```

의존성을 단방향으로 유지하면 자주 바뀌는 draft가 navigation consumer를 다시 렌더링하지 않습니다.

## 넓은 투영 피하기

```tsx
// 피하기
const { store } = useApp(s => ({ store: s }))

// 권장
const { threadId, selectThread } = useApp(s => ({
  threadId: s.threadId,
  selectThread: s.selectThread,
}))
```

공개 action은 평범한 함수입니다. `useEffectEvent`는 Effect 내부에서 호출하는 이벤트에만 사용하세요.
