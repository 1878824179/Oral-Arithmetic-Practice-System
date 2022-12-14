import React, { useContext, useEffect, useRef, useState } from "react";
import css from "./index.module.css";
import {
  Button,
  Form,
  Input,
  Popconfirm,
  Table,
  Modal,
  Select,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  GetExerciseGroupAPI,
  AddExerciseGroupAPI,
  DeleteGroupAPI,
  ExportAPI,
} from "../../../request/api";
import axios from "axios";
const EditableContext = React.createContext(null);

const EditableRow = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};
const EditableCell = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  const form = useContext(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log("Save failed:", errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};
const BankPage = () => {
  useEffect(() => {
    getExerciseGroup();
  }, []);
  const [level, setLevel] = useState(); //????????????
  const [isModalOpen, setIsModalOpen] = useState(false); //?????????????????????
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigateTo = useNavigate();
  const [data, setData] = useState([]);
  const getExerciseGroup = async () => {
    let res = await GetExerciseGroupAPI({
      page: currentPage,
      rows: pageSize,
      start: (currentPage - 1) * 10,
    });
    console.log("????????????", res);
    if (res.code === 200) {
      setData(res.data.list);
      setTotal(res.data.total);
    }
  };
  const gotoExercise = (record) => {
    console.log("record", record);
    localStorage.setItem("groupId", record.key);
    navigateTo(`/exerise/study`);
  };
  const handleDelete = async (e) => {
    let res = await DeleteGroupAPI(e.key);
    if (res.code === 200) {
      message.success("????????????");
      getExerciseGroup();
    }
  };
  const dowmLoadDataQuery = (res, e) => {
    let data = res;
    console.log(e);
  };
  const exportGroupId = async (e) => {
    axios({
      url: `http://47.108.238.92:8084//exercise/export?groupId=${e.key}`,
      method: "get",
      responseType: "blob",
      headers: {
        token: localStorage.getItem("token"),
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
      },
    }).then((res) => {
      console.log(res);
      const link = document.createElement("a");
      let blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      link.style.display = "none";
      link.href = window.URL.createObjectURL(blob);
      link.download = "???" + e.key + "????????????";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  const defaultColumns = [
    {
      title: "????????????",
      dataIndex: "bankNumber",
      width: "10%",
      editable: true,
    },
    {
      title: "??????",
      width: "10%",
      dataIndex: "number",
    },
    {
      title: "??????",
      width: "10%",
      dataIndex: "difficulty",
    },
    {
      title: "????????????",
      width: "20%",
      dataIndex: "startTime",
    },
    {
      title: "????????????",
      width: "20%",
      dataIndex: "endTime",
    },
    {
      title: "??????",
      dataIndex: "exercise",
      render: (_, record) =>
        data.length >= 1 ? (
          <Popconfirm
            title="???????????????????"
            onConfirm={() => gotoExercise(record)}
          >
            <a>????????????</a>
          </Popconfirm>
        ) : null,
    },
    {
      title: "??????",
      dataIndex: "",
      render: (_, record) => (
        <div style={{ display: "flex" }}>
          <div>
            {data.length >= 1 ? (
              <Popconfirm
                title="?????????????"
                okText="???"
                cancelText="???"
                onConfirm={() => exportGroupId(record)}
              >
                <a>??????</a>
              </Popconfirm>
            ) : null}
          </div>
          &nbsp;&nbsp;&nbsp;
          <div>
            {data.length >= 1 ? (
              <Popconfirm
                title="?????????????"
                okText="??????"
                cancelText="??????"
                onConfirm={() => handleDelete(record)}
              >
                <a>??????</a>
              </Popconfirm>
            ) : null}
          </div>
        </div>
      ),
    },
  ];
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
      }),
    };
  });
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = async () => {
    if (count === 0 || level <= 0) {
      message.warning("?????????????????????");
    } else if (count > 20) {
      message.warning("?????????????????????20");
    } else {
      let res = await AddExerciseGroupAPI({ level, total: count });
      if (res.code === 200) {
        message.success("????????????");
        setIsModalOpen(false);
        getExerciseGroup();
      }
    }
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const getTopicNumber = (e) => {
    console.log("??????", e.target.value);
    setCount(parseInt(e.target.value));
  };
  const getLevel = (e) => {
    console.log("??????", parseInt(e));
    setLevel(parseInt(e));
  };
  const pageChange = (e) => {
    console.log("?????????", e);
    setCurrentPage(e);
  };
  useEffect(() => {
    getExerciseGroup();
  }, [currentPage]);
  const pagination = {
    pageSize,
    currentPage,
    total,
    onChange: pageChange,
  };
  return (
    <div className={css.box}>
      <div className={css.btn}>
        <Modal
          title="???????????????"
          okText="??????"
          cancelText="??????"
          open={isModalOpen}
          onOk={handleOk}
          onCancel={handleCancel}
        >
          <Form
            name="basic"
            labelCol={{
              span: 8,
            }}
            wrapperCol={{
              span: 16,
            }}
            initialValues={{
              remember: true,
            }}
            autoComplete="off"
          >
            <Form.Item
              label="?????????"
              name="?????????"
              rules={[
                {
                  required: true,
                  message: "????????????????????????????????????!",
                },
              ]}
            >
              <Input onChange={getTopicNumber} placeholder="?????????????????????20" />
            </Form.Item>
            <Form.Item
              label="??????"
              name="??????"
              rules={[
                {
                  required: true,
                  message: "???????????????",
                },
              ]}
            >
              <Select
                style={{ width: 120 }}
                onChange={getLevel}
                options={[
                  {
                    value: "1",
                    label: "1??????",
                  },
                  {
                    value: "2",
                    label: "2??????",
                  },
                  {
                    value: "3",
                    label: "3??????",
                  },
                  {
                    value: "4",
                    label: "4??????",
                  },
                  {
                    value: "5",
                    label: "5??????",
                  },
                  {
                    value: "6",
                    label: "6??????",
                  },
                ]}
              />
            </Form.Item>
          </Form>
        </Modal>
        <Button
          onClick={showModal}
          type="primary"
          style={{
            marginBottom: 16,
            marginLeft: 0,
          }}
        >
          ???????????????
        </Button>
      </div>
      <div className={css.table}>
        <Table
          components={components}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={data.map((value) => {
            return {
              key: value["id"],
              bankNumber: value["id"],
              number: value["num"],
              difficulty: value["level"] + "??????",
              startTime: value["createTime"].substring(0, 10),
              endTime:
                value["entTime"] === null
                  ? value["entTime"].substring(0, 10)
                  : "?????????",
            };
          })}
          columns={columns}
          className={css.table}
          pagination={pagination}
        />
      </div>
    </div>
  );
};
export default BankPage;
