import {
  Text,
  SafeAreaView,
  Button,
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import React, {useState} from 'react';

import {useMqttPaho} from '../infrastructure/mqtt/hooks/useMqttPaho';

const Home = () => {
  const [brokerHost, setBrokerHost] = useState<string>('');
  const [brokerPort, setBrokerPort] = useState<string>('');
  const [subscriptionTopic, setSubscriptionTopic] = useState<string>('');
  const [publishTopic, setPublishTopic] = useState<string>('');
  const [messageToSend, setMessageToSend] = useState<string>('');

  const {
    clearMessages,
    connectToBroker,
    disconnectFromBroker,
    isConnected,
    unsubscribeFromTopic,
    unsubscribeFromCurrentTopic,
    sendCustomMessage,
    subscribeToWildcard,
    subscribeToTopic,
    subscribedTopics,
    receivedMessages,
  } = useMqttPaho({
    brokerHost,
    brokerPort,
    messageToSend,
    publishTopic,
    subscriptionTopic,
  });

  const sendMqttMessage = async () => {
    try {
      await sendCustomMessage();
      setMessageToSend('');
    } catch (error) {
      Alert.alert('Error', 'Could not send message');
    }
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
              onPress={sendMqttMessage}
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
