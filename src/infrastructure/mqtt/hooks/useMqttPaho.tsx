import {Alert} from 'react-native';
import {useRef, useState} from 'react';
import Paho from 'paho-mqtt';

/* Handlers */
import {handleOnMessage} from '../handlers/onMessage';

interface Props {
  brokerHost: string;
  brokerPort: string;
  subscriptionTopic: string;
  publishTopic: string;
  messageToSend: string;
}

export function useMqttPaho({
  brokerHost,
  brokerPort,
  messageToSend,
  publishTopic,
  subscriptionTopic,
}: Props) {
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const clientRef = useRef<Paho.Client | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);

  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);

  const connectToBroker = (): void => {
    if (isConnected) {
      Alert.alert('Info', 'You are already connected to the broker');
      return;
    }

    if (!brokerHost.trim() || !brokerPort.trim()) {
      Alert.alert('Error', 'Please enter the broker host and port');
      return;
    }

    try {
      const newClient = new Paho.Client(
        brokerHost,
        parseInt(brokerPort),
        `selba-app-${Math.random().toString(16).slice(3)}`,
      );

      newClient.connect({
        useSSL: false,
        onSuccess: () => {
          console.log('✅ Connected to broker:', brokerHost);
          setIsConnected(true);
          isConnectedRef.current = true;
          clientRef.current = newClient;

          // Configure the message callback BEFORE subscribing
          newClient.onMessageArrived = handleOnMessage({
            clientRef,
            setReceivedMessages,
          });

          // Subscribe to topic if configured
          if (subscriptionTopic.trim()) {
            newClient.subscribe(subscriptionTopic);
            console.log('📡 Subscribed to:', subscriptionTopic);
          }

          Alert.alert('Success', 'Connected to MQTT broker');
        },
        onFailure: (err: any) => {
          console.log('❌ Connection failed:', err);
          Alert.alert('Error', 'Could not connect to broker');
        },
      });
    } catch (error) {
      console.error('❌ Error creating client:', error);
      Alert.alert('Error', 'Error creating MQTT client');
    }
  };

  const disconnectFromBroker = (): void => {
    if (clientRef.current && isConnected) {
      try {
        console.log('🔌 Attempting to disconnect from broker...');

        // First unsubscribe from all topics
        subscribedTopics.forEach(topic => {
          try {
            clientRef.current!.unsubscribe(topic);
            console.log('🚫 Unsubscribed from:', topic);
          } catch (error) {
            console.error('❌ Error unsubscribing from', topic, ':', error);
          }
        });

        // Remove the message callback
        clientRef.current.onMessageArrived = () => {}; // Empty function instead of null

        // Disconnect from the broker
        clientRef.current.disconnect();

        // Clear state
        clientRef.current = null;
        setIsConnected(false);
        isConnectedRef.current = false; // Update both
        setSubscribedTopics([]);

        console.log('✅ Successfully disconnected from broker');
        Alert.alert('Success', 'Disconnected from broker and all topics');
      } catch (error) {
        console.error('❌ Error disconnecting:', error);
        // Force state cleanup even if there is an error
        clientRef.current = null;
        setIsConnected(false);
        isConnectedRef.current = false; // Update both
        setSubscribedTopics([]);
        Alert.alert(
          'Warning',
          'Disconnection may have failed, but state cleared',
        );
      }
    }
  };

  const subscribeToTopic = (): void => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'You must first connect to the broker');
      return;
    }

    if (!subscriptionTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic to subscribe to');
      return;
    }

    if (subscribedTopics.includes(subscriptionTopic)) {
      Alert.alert('Info', 'Already subscribed to this topic');
      return;
    }

    try {
      clientRef.current.subscribe(subscriptionTopic);
      setSubscribedTopics(prev => [...prev, subscriptionTopic]);
      console.log('📡 Subscribed to topic:', subscriptionTopic);
      Alert.alert('Success', `Subscribed to topic: ${subscriptionTopic}`);
    } catch (error) {
      console.error('❌ Error subscribing:', error);
      Alert.alert('Error', 'Could not subscribe to topic');
    }
  };

  const unsubscribeFromTopic = (topic: string): void => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'You must first connect to the broker');
      return;
    }

    try {
      clientRef.current.unsubscribe(topic);
      setSubscribedTopics(prev => prev.filter(t => t !== topic));
      console.log('🚫 Unsubscribed from topic:', topic);
      Alert.alert('Success', `Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      Alert.alert('Error', 'Could not unsubscribe from topic');
    }
  };

  const unsubscribeFromCurrentTopic = (): void => {
    if (!subscriptionTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic to unsubscribe from');
      return;
    }
    unsubscribeFromTopic(subscriptionTopic);
  };

  // Function to subscribe to multiple topics (useful for debugging)
  const subscribeToWildcard = (): void => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'You must first connect to the broker');
      return;
    }

    try {
      // Subscribe to all topics with wildcard
      clientRef.current.subscribe('#');
      if (!subscribedTopics.includes('#')) {
        setSubscribedTopics(prev => [...prev, '#']);
      }
      console.log('📡 Subscribed to ALL topics (#)');
      Alert.alert('Success', 'Subscribed to all topics (#)');
    } catch (error) {
      console.error('❌ Error subscribing to wildcard:', error);
      Alert.alert('Error', 'Could not subscribe to wildcard');
    }
  };

  const sendCustomMessage = async () => {
    if (!clientRef.current || !isConnected) {
      Alert.alert('Error', 'You must first connect to the broker');
      return;
    }

    if (!publishTopic.trim()) {
      Alert.alert('Error', 'Please configure the publish topic');
      return;
    }

    if (!messageToSend.trim()) {
      Alert.alert('Error', 'Please enter a message to send');
      return;
    }

    try {
      const message = new Paho.Message(messageToSend);
      message.destinationName = publishTopic;
      clientRef.current.send(message);
      console.log('📤 Message sent to', publishTopic, ':', messageToSend);

      Alert.alert('Success', 'Message sent');
      return Promise.resolve();
    } catch (error) {
      console.error('❌ Error sending custom message:', error);
      Alert.alert('Error', 'Could not send message');
      return Promise.reject(error);
    }
  };

  const clearMessages = (): void => {
    setReceivedMessages([]);
    console.log('🧹 Messages cleared');
  };

  return {
    clearMessages,
    sendCustomMessage,
    subscribeToWildcard,
    unsubscribeFromCurrentTopic,
    unsubscribeFromTopic,
    subscribeToTopic,
    disconnectFromBroker,
    connectToBroker,

    isConnected,
    receivedMessages,
    clientRef,
    isConnectedRef,
    messageToSend,
    subscribedTopics,
  };
}
