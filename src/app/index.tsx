import Header from "@/components/Header";
import { Button, Text, View } from "react-native";



export default function HomeScreen() {
  return (
     <View>
       <Header/>
      <Text>Hello World</Text>
      <Text>Ứng dụng quản lý chung cư mini</Text>
      <Button title="Bắt đầu" onPress={() => alert("Xin chào mobile")}/>
    </View>
  );
}

