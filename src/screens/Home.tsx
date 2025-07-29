import {
  Text,
  SafeAreaView,
  Button,
  StyleSheet,
  Alert,
  View,
  TextInput,
  ScrollView,
} from 'react-native';
import React, {useState, useRef} from 'react';
import Paho from 'paho-mqtt';

const Home = () => {
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);
  const clientRef = useRef<Paho.Client | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);

  const [brokerHost, setBrokerHost] = useState<string>('');
  const [brokerPort, setBrokerPort] = useState<string>('');
  const [subscriptionTopic, setSubscriptionTopic] = useState<string>('');
  const [publishTopic, setPublishTopic] = useState<string>('');
  const [messageToSend, setMessageToSend] = useState<string>('');
  const [subscribedTopics, setSubscribedTopics] = useState<string[]>([]);

  const onMessage = (message: Paho.Message): void => {
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
          newClient.onMessageArrived = onMessage;

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

  const sendCustomMessage = (): void => {
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
      setMessageToSend('');
      Alert.alert('Success', 'Message sent');
    } catch (error) {
      console.error('❌ Error sending custom message:', error);
      Alert.alert('Error', 'Could not send message');
    }
  };

  const clearMessages = (): void => {
    setReceivedMessages([]);
    console.log('🧹 Messages cleared');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>MQTT Configurable Client</Text>

        <View style={styles.statusContainer}>
          <Text
            style={[styles.statusText, {color: isConnected ? 'green' : 'red'}]}>
            Status: {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
          <View style={{marginTop: 10}}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text style={styles.valueText}>Received messages:</Text>
              {receivedMessages.length > 0 && (
                <Button title="Clear" onPress={clearMessages} />
              )}
            </View>
            {receivedMessages.length === 0 ? (
              <Text style={{color: '#999', marginTop: 5}}>No messages yet</Text>
            ) : (
              receivedMessages.slice(0, 10).map((msg, index) => (
                <Text
                  key={index}
                  style={{color: '#333', marginTop: 5, fontSize: 12}}>
                  • {msg}
                </Text>
              ))
            )}
            {receivedMessages.length > 10 && (
              <Text style={{color: '#666', marginTop: 5, fontStyle: 'italic'}}>
                ... and {receivedMessages.length - 10} more messages
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Broker Configuration</Text>

          <TextInput
            style={styles.input}
            placeholder="Broker host (e.g: broker.hivemq.com)"
            value={brokerHost}
            onChangeText={setBrokerHost}
            editable={!isConnected}
          />

          <TextInput
            style={styles.input}
            placeholder="Port (e.g: 8000)"
            value={brokerPort}
            onChangeText={setBrokerPort}
            keyboardType="numeric"
            editable={!isConnected}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={isConnected ? 'Disconnect' : 'Connect'}
              onPress={isConnected ? disconnectFromBroker : connectToBroker}
              color={isConnected ? '#ff6b6b' : '#4ecdc4'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topics</Text>

          <TextInput
            style={styles.input}
            placeholder="Subscription topic"
            value={subscriptionTopic}
            onChangeText={setSubscriptionTopic}
          />

          <View style={styles.buttonRow}>
            <View style={styles.buttonHalf}>
              <Button
                title="Subscribe"
                onPress={subscribeToTopic}
                disabled={!isConnected}
              />
            </View>
            <View style={styles.buttonHalf}>
              <Button
                title="Unsubscribe"
                onPress={unsubscribeFromCurrentTopic}
                disabled={!isConnected}
                color="#ff6b6b"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Subscribe to ALL (#)"
              onPress={subscribeToWildcard}
              disabled={!isConnected}
              color="#ff9500"
            />
          </View>

          {/* List of subscribed topics */}
          {subscribedTopics.length > 0 && (
            <View style={styles.subscribedTopicsContainer}>
              <Text style={styles.subscribedTopicsTitle}>
                Subscribed Topics:
              </Text>
              {subscribedTopics.map((topic, index) => (
                <View key={index} style={styles.subscribedTopicItem}>
                  <Text style={styles.subscribedTopicText}>{topic}</Text>
                  <Button
                    title="Unsub"
                    onPress={() => unsubscribeFromTopic(topic)}
                    color="#ff6b6b"
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Messages</Text>

          <Text style={styles.sectionRef}>Publish Topic</Text>
          <TextInput
            style={styles.input}
            placeholder="Publish topic"
            value={publishTopic}
            onChangeText={setPublishTopic}
          />

          <Text style={styles.sectionRef}>Message</Text>
          <TextInput
            style={styles.input}
            placeholder="Custom message"
            value={messageToSend}
            onChangeText={setMessageToSend}
          />

          <View style={styles.buttonContainer}>
            <Button
              title="Send Message"
              onPress={sendCustomMessage}
              disabled={!isConnected}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  container2: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  valueText: {
    fontSize: 18,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  sectionRef: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#495057',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  buttonHalf: {
    flex: 0.48,
  },
  subscribedTopicsContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  subscribedTopicsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#495057',
  },
  subscribedTopicItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  subscribedTopicText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
});
