import Paho from 'paho-mqtt';

interface Params {
  clientRef: React.MutableRefObject<Paho.Client | null>;
  setReceivedMessages: (value: React.SetStateAction<string[]>) => void;
}

export const handleOnMessage = ({
  clientRef,
  setReceivedMessages,
}: Params): ((message: Paho.Message) => void) => {
  return (message: Paho.Message) => {
    if (!clientRef.current) {
      console.log(
        '⚠️ Received message but no client exists, ignoring:',
        message.payloadString,
      );
      return;
    }

    console.log('=== MESSAGE RECEIVED ===');
    console.log('Topic:', message.destinationName);
    console.log('Mensaje:', message.payloadString);
    console.log('Timestamp:', new Date().toLocaleTimeString());
    console.log('Client exists:', !!clientRef.current);
    console.log('========================');

    const messageWithTopic = `[${message.destinationName}] ${message.payloadString}`;
    setReceivedMessages(prev => [messageWithTopic, ...prev]);
  };
};
