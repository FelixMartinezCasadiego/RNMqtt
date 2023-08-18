import {Text, SafeAreaView, Button, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';
import Paho from 'paho-mqtt';

let client = new Paho.Client('broker.hivemq.com', 8000, `mqtt-async-test`);

const Home = () => {
  const [value, setValue] = useState(0);
  const onMessage = (message: Paho.Message) => {
    if (message.destinationName === 'mqtt-async-test/value') {
      setValue(parseInt(message.payloadString));
    }
  };
  useEffect(() => {
    client.connect({
      onSuccess: () => {
        console.log('Connected!');
        client.subscribe('mqtt-async-test/value');
        client.onMessageArrived = onMessage;
      },
      onFailure: () => {
        console.log('Failed to connect');
      },
    });
  }, []);

  const changeValue = (client: Paho.Client) => {
    const message = new Paho.Message((value + 1).toString());
    message.destinationName = 'mqtt-async-test/value';
    console.log('message ----> ', message);
    client.send(message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>PRUEBA DE MQTT</Text>
      <Text>Value is: {value}</Text>
      <Button
        onPress={() => {
          changeValue(client);
        }}
        title="Press Me!"
      />
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
});
