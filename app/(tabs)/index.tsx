import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import Card from "@/library/components/card";
import Chip from "@/library/components/chip";
import PageContainer from "@/library/components/pageContainer";
import { ChartArea, Wallet } from "lucide-react-native";
import { View } from "react-native";

export default function Dashboard() {
  return <PageContainer>
    <View
      style={{
        alignItems: "center",
        marginBottom: 20,
        marginTop: 20,
      }}
    >
      <Text
        size="2xl"
        style={{
          color: "#7a8799",
          marginBottom: 20
        }}
      >
        Total Net Worth
      </Text>
      <Text
        size="5xl"
        bold
        style={{
          color: "white",
          lineHeight: 50,
          marginBottom: 12,
        }}
      >
        $124,500.00
      </Text>
      <Chip
        text="+2.4% this week"
        status={true}
      />
    </View>
    <Card>
      <View
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <Text
          style={{
            color: "#7a8799",
          }}
          size="lg"
        >
          Montly Remaining
        </Text>
        <Wallet
          color={"#7a8799"}
        />
      </View>
      <View>
        <Text
          size="2xl"
          bold
          style={{
            marginBottom: 48,
            color: "white",
          }}
        >
          $3.240.50
        </Text>
      </View>
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12
          }}
        >
          <Text
            size="md"
            bold
            style={{
              color: "#7a8799",
            }}
          >
            %72 used
          </Text>
          <Text
            size="md"
            bold
            style={{
              color: "#7a8799",
            }}
          >
            $1,259.50 left
          </Text>
        </View>
        <Progress
          value={72}
          style={{
            backgroundColor: "#151d2b"
          }}
        >
          <ProgressFilledTrack
            style={{
              backgroundColor: "#006fed"
            }}
          />
        </Progress>
      </View>
    </Card>
    <Card>
      <View
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            color: "#7a8799",
          }}
          size="lg"
        >
          Portfolio Health
        </Text>
        <ChartArea
          color={"#7a8799"}
        />
      </View>
      <Text
        style={{
          color: "white",
        }}
        size="md"
      >
        Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Cum accusantium perferendis ea maxime autem, facere quaerat quod
        reiciendis voluptates fuga accusamus, iure nisi tempora voluptatum,
        dolorum ad possimus amet velit!
      </Text>
    </Card>
  </PageContainer>
}